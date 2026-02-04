// src/app/api/cart/add/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/db';
import { cartItems, products, session as sessionTable } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Función auxiliar para obtener el carrito actualizado tras añadir
async function getFullCart(userId: string | null, sessionId: string | null) {
  const whereCart = userId
    ? eq(cartItems.userId, userId)
    : eq(cartItems.sessionId, sessionId!);

  const rows = await db
    .select({
      id: cartItems.id,
      productId: cartItems.productId,
      quantity: cartItems.quantity,
      productPrice: products.price,
      productName: products.name,
    })
    .from(cartItems)
    .leftJoin(products, eq(cartItems.productId, products.id))
    .where(whereCart);

  const subtotal = rows.reduce((acc, r) => acc + (Number(r.productPrice ?? 0) * r.quantity), 0);
  const itemCount = rows.reduce((acc, r) => acc + r.quantity, 0);

  return { items: rows, subtotal, itemCount };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    
    // 1. Extraemos los datos del cuerpo
    const productId = Number(body.productId);
    const qty = Number(body.quantity ?? 1);
    const requestSessionId = body.sessionId;

    // 2. Identificamos al usuario (Auth o Sesión)
    const h = await headers();
    const session = await auth.api.getSession({ headers: h }).catch(() => null);
    let userId = session?.user?.id ?? null;

    // Si no hay userId, buscamos el sessionId (usamos el nuevo nombre unificado)
    const sessionId = userId ? null : (requestSessionId || h.get('x-session-id'));

    if (!userId && !sessionId) {
      return NextResponse.json({ error: 'Identificación de sesión requerida' }, { status: 400 });
    }

    if (isNaN(productId)) {
      return NextResponse.json({ error: 'ID de producto no válido' }, { status: 400 });
    }

    // 3. Verificamos si el producto existe
    const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
    if (!product) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    // 4. Lógica de añadir/actualizar
    const whereExisting = userId
      ? and(eq(cartItems.userId, userId), eq(cartItems.productId, productId))
      : and(eq(cartItems.sessionId, sessionId!), eq(cartItems.productId, productId));

    const [existing] = await db.select().from(cartItems).where(whereExisting).limit(1);

    if (existing) {
      await db.update(cartItems)
        .set({ 
          quantity: Math.min(existing.quantity + qty, 10), 
          updatedAt: new Date().toISOString() 
        })
        .where(eq(cartItems.id, existing.id));
    } else {
      await db.insert(cartItems).values({
        userId,
        sessionId,
        productId,
        quantity: Math.min(qty, 10),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // 5. Devolvemos el carrito actualizado
    const cartData = await getFullCart(userId, sessionId);
    return NextResponse.json({ ok: true, ...cartData });

  } catch (err) {
    console.error('ERROR FATAL ADD TO CART:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
