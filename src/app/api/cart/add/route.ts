import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { cartItems, products } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Authentication logic - check for Bearer token or sessionId
    const authHeader = request.headers.get('authorization');
    let userId: string | null = null;
    let sessionId: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const session = await auth.api.getSession({
          headers: request.headers
        });
        if (session?.user?.id) {
          userId = session.user.id;
        }
      } catch (error) {
        // Token invalid, continue as guest
      }
    }

    // Parse request body
    const body = await request.json();
    const { productId, quantity, sessionId: requestSessionId } = body;

    // If no userId, use sessionId from request
    if (!userId) {
      sessionId = requestSessionId;
      if (!sessionId) {
        return NextResponse.json(
          { error: 'Se requiere autenticación o ID de sesión' },
          { status: 400 }
        );
      }
    }

    // Validate required fields
    if (!productId || typeof productId !== 'number') {
      return NextResponse.json(
        { error: 'ID de producto es requerido y debe ser un número' },
        { status: 400 }
      );
    }

    // Validate quantity
    const qty = quantity ?? 1;
    if (typeof qty !== 'number' || qty < 1 || qty > 10) {
      return NextResponse.json(
        { error: 'La cantidad debe estar entre 1 y 10' },
        { status: 400 }
      );
    }

    // Check if product exists
    const product = await db.select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (product.length === 0) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    // Check product stock
    if (product[0].stock < qty) {
      return NextResponse.json(
        { error: 'Stock insuficiente' },
        { status: 400 }
      );
    }

    // Check if cart item already exists
    const existingCartItemCondition = userId
      ? and(eq(cartItems.userId, userId), eq(cartItems.productId, productId))
      : and(eq(cartItems.sessionId, sessionId!), eq(cartItems.productId, productId));

    const existingCartItem = await db.select()
      .from(cartItems)
      .where(existingCartItemCondition)
      .limit(1);

    if (existingCartItem.length > 0) {
      // Item exists, update quantity
      const newQuantity = existingCartItem[0].quantity + qty;

      // Check if new quantity exceeds maximum
      if (newQuantity > 10) {
        return NextResponse.json(
          { error: 'No puedes agregar más de 10 unidades de este producto' },
          { status: 400 }
        );
      }

      // Check if new quantity exceeds stock
      if (product[0].stock < newQuantity) {
        return NextResponse.json(
          { error: 'Stock insuficiente' },
          { status: 400 }
        );
      }

      // Update existing cart item
      const updated = await db.update(cartItems)
        .set({
          quantity: newQuantity,
          updatedAt: new Date().toISOString()
        })
        .where(existingCartItemCondition)
        .returning();

      return NextResponse.json(updated[0], { status: 200 });
    } else {
      // Item doesn't exist, create new cart item
      const newCartItem = await db.insert(cartItems)
        .values({
          userId: userId,
          sessionId: sessionId,
          productId: productId,
          quantity: qty,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .returning();

      return NextResponse.json(newCartItem[0], { status: 201 });
    }
  } catch (error) {
    console.error('POST /api/cart/add error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor: ' + (error instanceof Error ? error.message : 'Error desconocido') },
      { status: 500 }
    );
  }
}