// src/app/api/cart/add/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/db';
import { cartItems, products } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Esta función ahora devuelve el formato que tu CartContext necesita
async function getFullCart(userId: string | null, sessionId: string | null) {
  const whereCart = userId
    ? eq(cartItems.userId, userId)
    : eq(cartItems.sessionId, sessionId!);

  const rows = await db
    .select({
      id: cartItems.id,
      productId: cartItems.productId,
      quantity: cartItems.quantity,
      p_id: products.id,
      p_name: products.name,
      p_brand: products.brand,
      p_price: products.price,
      p_imageUrl: products.imageUrl,
    })
    .from(cartItems)
    .leftJoin(products, eq(cartItems.productId, products.id))
    .where(whereCart);

  const items = rows.map(r => ({
    id: r.id,
    productId: r.productId,
    quantity: r.quantity,
    product: { // <--- ESTO ES LO QUE EL FRONTEND NECESITA
      id: r.p_id,
      name: r.p_name,
      brand: r.p_brand,
      price: Number(r.p_price || 0),
      imageUrl: r.p_imageUrl,
    }
  }));

  const subtotal = items.reduce((acc, it) => acc + (it.product.price * it.quantity), 0);
  const itemCount = items.reduce((acc, it) => acc + it.quantity, 0);

  return { items, subtotal, itemCount };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const productId = Number(body.productId);
    const qty = Number(body.quantity ?? 1);
    const requestSessionId = body.sessionId;

    const h = await headers();
    const session = await auth.api.getSession({ headers: h }).catch(() => null);
    let userId = session?.user?.id ?? null;
    const sessionId = userId ? null : (requestSessionId || h.get('x-session-id'));

    if (!userId && !sessionId) return NextResponse.json({ error: 'No session' }, { status: 400 });
    if (isNaN(productId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

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
        userId, sessionId, productId, quantity: Math.min(qty, 10),
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      });
    }

    const cartData = await getFullCart(userId, sessionId);
    return NextResponse.json({ ok: true, ...cartData });
  } catch (err) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
