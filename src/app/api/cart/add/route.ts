import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { cartItems, products, session as sessionTable } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // 1) Parseo de body robusto
    let body: any = null;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'El cuerpo de la petición debe ser JSON válido', code: 'INVALID_JSON' },
        { status: 400 }
      );
    }
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Cuerpo vacío o inválido', code: 'EMPTY_BODY' },
        { status: 400 }
      );
    }

    // 2) Extrae y normaliza
    const rawProductId = body.productId;
    const qty = body.quantity ?? 1;
    const requestSessionId = typeof body.sessionId === 'string' ? body.sessionId : null;

    // 3) Contexto de usuario (Bearer opcional)
    const authHeader = request.headers.get('authorization');
    let userId: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      // Busca el userId por token en la tabla session (Better Auth)
      const sessionRow = await db
        .select()
        .from(sessionTable)
        .where(eq(sessionTable.token, token))
        .limit(1);

      if (sessionRow.length > 0) {
        userId = sessionRow[0].userId;
      }
    }

    // 4) Validaciones de entrada
    const productId = Number(rawProductId);
    if (!Number.isFinite(productId)) {
      return NextResponse.json(
        { error: 'productId es requerido y debe ser numérico', code: 'INVALID_PRODUCT_ID' },
        { status: 400 }
      );
    }

    if (!Number.isFinite(qty) || qty < 1 || qty > 10) {
      return NextResponse.json(
        { error: 'quantity debe ser un número entre 1 y 10', code: 'INVALID_QUANTITY' },
        { status: 400 }
      );
    }

    // Invitado: si no hay userId, debe llegar sessionId
    let sessionId: string | null = userId ? null : requestSessionId;
    if (!userId && !sessionId) {
      return NextResponse.json(
        { error: 'Falta sessionId para carrito de invitado', code: 'MISSING_SESSION_ID' },
        { status: 400 }
      );
    }

    // 5) Producto existe + stock
    const productRows = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (productRows.length === 0) {
      return NextResponse.json(
        { error: 'Producto no encontrado', code: 'PRODUCT_NOT_FOUND' },
        { status: 404 }
      );
    }

    const product = productRows[0];

    if ((product.stock ?? 0) < qty) {
      return NextResponse.json(
        { error: 'Stock insuficiente', code: 'INSUFFICIENT_STOCK' },
        { status: 400 }
      );
    }

    // 6) ¿Ya existe en el carrito?
    const whereExisting = userId
      ? and(eq(cartItems.userId, userId), eq(cartItems.productId, productId))
      : and(eq(cartItems.sessionId, sessionId!), eq(cartItems.productId, productId));

    const existing = await db.select().from(cartItems).where(whereExisting).limit(1);

    if (existing.length > 0) {
      const newQuantity = existing[0].quantity + qty;

      if (newQuantity > 10) {
        return NextResponse.json(
          { error: 'Máximo 10 unidades por producto', code: 'QUANTITY_LIMIT_EXCEEDED' },
          { status: 400 }
        );
      }
      if ((product.stock ?? 0) < newQuantity) {
        return NextResponse.json(
          { error: 'Stock insuficiente para la cantidad solicitada', code: 'INSUFFICIENT_STOCK' },
          { status: 400 }
        );
      }

      const updated = await db
        .update(cartItems)
        .set({ quantity: newQuantity, updatedAt: new Date().toISOString() })
        .where(whereExisting)
        .returning();

      return NextResponse.json({ ok: true, item: updated[0] }, { status: 200 });
    }

    // 7) Inserta nuevo ítem
    const inserted = await db
      .insert(cartItems)
      .values({
        userId: userId || null,
        sessionId: sessionId || null,
        productId,
        quantity: qty,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json({ ok: true, item: inserted[0] }, { status: 201 });
  } catch (err) {
    console.error('POST /api/cart/add fatal:', err);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: (err as Error)?.message ?? String(err) },
      { status: 500 }
    );
  }
}
