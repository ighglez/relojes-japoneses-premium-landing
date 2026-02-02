// src/app/api/cart/add/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/db';
import { cartItems, products, session as sessionTable } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getFullCart(userId: string | null, sessionId: string | null) {
  const whereCart = userId
    ? eq(cartItems.userId, userId)
    : eq(cartItems.sessionId, sessionId!);

  const rows = await db
    .select({
      id: cartItems.id,
      productId: cartItems.productId,
      quantity: cartItems.quantity,
      createdAt: cartItems.createdAt,
      updatedAt: cartItems.updatedAt,
      productName: products.name,
      productBrand: products.brand,
      productReference: products.reference,
      productPrice: products.price,
      productStock: products.stock,
      productImageUrl: products.imageUrl,
      productImagesJson: products.images,
    })
    .from(cartItems)
    .leftJoin(products, eq(cartItems.productId, products.id))
    .where(whereCart);

  const items = rows.map((r) => {
    let imageUrl = r.productImageUrl ?? null;
    if (!imageUrl && r.productImagesJson) {
      try {
        const arr = typeof r.productImagesJson === "string"
          ? JSON.parse(r.productImagesJson)
          : r.productImagesJson;
        if (Array.isArray(arr) && arr.length > 0) imageUrl = arr[0];
      } catch {}
    }

    return {
      id: r.id,
      productId: r.productId,
      quantity: r.quantity,
      product: {
        id: r.productId,
        name: r.productName,
        brand: r.productBrand,
        reference: r.productReference,
        price: r.productPrice,
        stock: r.productStock,
        imageUrl,
      },
    };
  });

  const subtotal = rows.reduce((acc, r) => acc + (Number(r.productPrice ?? 0) * r.quantity), 0);
  const itemCount = rows.reduce((acc, r) => acc + r.quantity, 0);

  return { items, subtotal, itemCount };
}

export async function POST(request: NextRequest) {
  try {
    let body: any = null;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
    }

    const productId = Number(body.productId);
    const qty = Number(body.quantity ?? 1);

    const h = await headers();
    const headerSessionId = h.get('x-session-id');
    const requestSessionId = typeof body.sessionId === 'string' ? body.sessionId : null;

    let userId: string | null = null;
    try {
      const session = await auth.api.getSession({ headers: h });
      userId = session?.user?.id ?? null;
    } catch {}

    if (!userId) {
      const authHeader = h.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        const [sessionRow] = await db.select().from(sessionTable).where(eq(sessionTable.token, token)).limit(1);
        if (sessionRow) userId = sessionRow.userId;
      }
    }

    if (!Number.isFinite(productId)) {
      return NextResponse.json({ error: 'productId inválido' }, { status: 400 });
    }

    const sessionId: string | null = userId ? null : (requestSessionId || headerSessionId || null);
    if (!userId && !sessionId) {
      return NextResponse.json({ error: 'Falta sessionId' }, { status: 400 });
    }

    const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
    if (!product) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });

    const whereExisting = userId
      ? and(eq(cartItems.userId, userId), eq(cartItems.productId, productId))
      : and(eq(cartItems.sessionId, sessionId!), eq(cartItems.productId, productId));

    const [existing] = await db.select().from(cartItems).where(whereExisting).limit(1);

    if (existing) {
      await db.update(cartItems)
        .set({ quantity: Math.min(existing.quantity + qty, 10), updatedAt: new Date().toISOString() })
        .where(eq(cartItems.id, existing.id));
    } else {
      await db.insert(cartItems).values({
        userId: userId || null,
        sessionId: sessionId || null,
        productId,
        quantity: Math.min(qty, 10),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    const cartData = await getFullCart(userId, sessionId);
    return NextResponse.json({ ok: true, ...cartData }, { status: 200 });
  } catch (err) {
    console.error('POST /api/cart/add fatal:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
