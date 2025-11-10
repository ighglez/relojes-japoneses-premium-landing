import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { cartItems, products } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Authentication
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Autenticación requerida' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Parse request body
    const body = await request.json();
    const { guestSessionId } = body;

    // Validate guestSessionId
    if (!guestSessionId) {
      return NextResponse.json(
        { error: 'guestSessionId es requerido' },
        { status: 400 }
      );
    }

    // Fetch all guest cart items
    const guestCartItems = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.sessionId, guestSessionId));

    // Process each guest cart item
    for (const guestItem of guestCartItems) {
      // Check if user already has this product in their cart
      const existingUserItem = await db
        .select()
        .from(cartItems)
        .where(
          and(
            eq(cartItems.userId, userId),
            eq(cartItems.productId, guestItem.productId)
          )
        )
        .limit(1);

      if (existingUserItem.length > 0) {
        // User already has this product - merge quantities
        const currentItem = existingUserItem[0];
        const newQuantity = Math.min(
          currentItem.quantity + guestItem.quantity,
          10
        );

        // Update existing user cart item
        await db
          .update(cartItems)
          .set({
            quantity: newQuantity,
            updatedAt: new Date().toISOString()
          })
          .where(eq(cartItems.id, currentItem.id));

        // Delete guest cart item
        await db
          .delete(cartItems)
          .where(eq(cartItems.id, guestItem.id));
      } else {
        // User doesn't have this product - transfer ownership
        await db
          .update(cartItems)
          .set({
            userId: userId,
            sessionId: null,
            updatedAt: new Date().toISOString()
          })
          .where(eq(cartItems.id, guestItem.id));
      }
    }

    // Fetch merged cart with product details
    const userCartItems = await db
      .select({
        id: cartItems.id,
        productId: cartItems.productId,
        quantity: cartItems.quantity,
        createdAt: cartItems.createdAt,
        updatedAt: cartItems.updatedAt,
        product: {
          id: products.id,
          slug: products.slug,
          name: products.name,
          brand: products.brand,
          series: products.series,
          reference: products.reference,
          price: products.price,
          currency: products.currency,
          stock: products.stock,
          images: products.images,
        }
      })
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, userId));

    // Calculate subtotal and item count
    const subtotal = userCartItems.reduce((sum, item) => {
      const price = item.product?.price || 0;
      return sum + (price * item.quantity);
    }, 0);

    const itemCount = userCartItems.reduce((sum, item) => sum + item.quantity, 0);

    return NextResponse.json({
      items: userCartItems,
      subtotal: parseFloat(subtotal.toFixed(2)),
      itemCount
    }, { status: 200 });

  } catch (error) {
    console.error('POST /api/cart/merge error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor: ' + (error as Error).message },
      { status: 500 }
    );
  }
}