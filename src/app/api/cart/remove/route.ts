import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { cartItems, session } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    const guestSessionId = searchParams.get('sessionId');

    // Validate itemId
    if (!itemId || isNaN(parseInt(itemId))) {
      return NextResponse.json(
        { error: 'ID del artículo es requerido', code: 'INVALID_ITEM_ID' },
        { status: 400 }
      );
    }

    // Extract authentication from Authorization header
    const authHeader = request.headers.get('Authorization');
    let userId: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Query session table to get userId from token
      const sessionRecord = await db.select()
        .from(session)
        .where(eq(session.token, token))
        .limit(1);

      if (sessionRecord.length > 0) {
        userId = sessionRecord[0].userId;
      }
    }

    // Require either userId (authenticated) or sessionId (guest)
    if (!userId && !guestSessionId) {
      return NextResponse.json(
        { error: 'Se requiere autenticación o ID de sesión', code: 'AUTH_REQUIRED' },
        { status: 400 }
      );
    }

    // Find cart item
    const cartItem = await db.select()
      .from(cartItems)
      .where(eq(cartItems.id, parseInt(itemId)))
      .limit(1);

    if (cartItem.length === 0) {
      return NextResponse.json(
        { error: 'Artículo del carrito no encontrado', code: 'ITEM_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Verify ownership - matches either userId or sessionId
    const item = cartItem[0];
    const ownershipMatches = userId 
      ? item.userId === userId 
      : item.sessionId === guestSessionId;

    if (!ownershipMatches) {
      return NextResponse.json(
        { error: 'Este artículo no pertenece a tu carrito', code: 'UNAUTHORIZED_ACCESS' },
        { status: 404 }
      );
    }

    // Delete cart item with ownership verification
    const deleteCondition = userId
      ? and(eq(cartItems.id, parseInt(itemId)), eq(cartItems.userId, userId))
      : and(eq(cartItems.id, parseInt(itemId)), eq(cartItems.sessionId, guestSessionId!));

    const deleted = await db.delete(cartItems)
      .where(deleteCondition)
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Error al eliminar el artículo del carrito', code: 'DELETE_FAILED' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Producto eliminado del carrito"
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE /api/cart/remove error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor: ' + (error as Error).message },
      { status: 500 }
    );
  }
}