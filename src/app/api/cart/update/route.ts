import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { cartItems, products } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const body = await request.json();
    const { itemId, quantity, sessionId } = body;

    // Validate required fields
    if (!itemId || typeof itemId !== 'number') {
      return NextResponse.json({
        error: 'ID del artículo del carrito es requerido',
        code: 'ITEM_ID_REQUIRED'
      }, { status: 400 });
    }

    if (!quantity || typeof quantity !== 'number') {
      return NextResponse.json({
        error: 'Cantidad es requerida',
        code: 'QUANTITY_REQUIRED'
      }, { status: 400 });
    }

    // Validate quantity range
    if (quantity < 1 || quantity > 10) {
      return NextResponse.json({
        error: 'La cantidad debe estar entre 1 y 10',
        code: 'INVALID_QUANTITY_RANGE'
      }, { status: 400 });
    }

    // Determine user context
    let userId: string | null = null;
    let guestSessionId: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Get session from better-auth
      const sessionResult = await db.select()
        .from(require('@/db/schema').session)
        .where(eq(require('@/db/schema').session.token, token))
        .limit(1);

      if (sessionResult.length > 0) {
        userId = sessionResult[0].userId;
      }
    }

    if (!userId) {
      if (!sessionId || typeof sessionId !== 'string') {
        return NextResponse.json({
          error: 'Sesión de invitado es requerida cuando no hay autenticación',
          code: 'SESSION_ID_REQUIRED'
        }, { status: 400 });
      }
      guestSessionId = sessionId;
    }

    // Find cart item
    let cartItemQuery = db.select().from(cartItems).where(eq(cartItems.id, itemId));
    
    const cartItemResult = await cartItemQuery.limit(1);

    if (cartItemResult.length === 0) {
      return NextResponse.json({
        error: 'Artículo del carrito no encontrado',
        code: 'CART_ITEM_NOT_FOUND'
      }, { status: 404 });
    }

    const cartItem = cartItemResult[0];

    // Verify ownership
    const belongsToUser = userId 
      ? cartItem.userId === userId 
      : cartItem.sessionId === guestSessionId;

    if (!belongsToUser) {
      return NextResponse.json({
        error: 'Artículo del carrito no encontrado',
        code: 'CART_ITEM_NOT_FOUND'
      }, { status: 404 });
    }

    // Check product stock
    if (!cartItem.productId) {
      return NextResponse.json({
        error: 'Producto no válido',
        code: 'INVALID_PRODUCT'
      }, { status: 400 });
    }

    const productResult = await db.select()
      .from(products)
      .where(eq(products.id, cartItem.productId))
      .limit(1);

    if (productResult.length === 0) {
      return NextResponse.json({
        error: 'Producto no encontrado',
        code: 'PRODUCT_NOT_FOUND'
      }, { status: 404 });
    }

    const product = productResult[0];

    // Validate stock availability
    if (product.stock < quantity) {
      return NextResponse.json({
        error: `Stock insuficiente. Solo hay ${product.stock} unidades disponibles`,
        code: 'INSUFFICIENT_STOCK'
      }, { status: 400 });
    }

    // Update cart item
    const updatedCartItem = await db.update(cartItems)
      .set({
        quantity,
        updatedAt: new Date().toISOString()
      })
      .where(eq(cartItems.id, itemId))
      .returning();

    if (updatedCartItem.length === 0) {
      return NextResponse.json({
        error: 'Error al actualizar el artículo del carrito',
        code: 'UPDATE_FAILED'
      }, { status: 500 });
    }

    return NextResponse.json(updatedCartItem[0], { status: 200 });

  } catch (error) {
    console.error('PATCH /api/cart/update error:', error);
    return NextResponse.json({
      error: 'Error interno del servidor: ' + (error instanceof Error ? error.message : 'Error desconocido')
    }, { status: 500 });
  }
}