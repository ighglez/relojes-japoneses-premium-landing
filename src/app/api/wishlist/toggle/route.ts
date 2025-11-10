import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { wishlists, products } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Debes iniciar sesión para usar la lista de deseos' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Parse and validate request body
    const body = await request.json();
    const { productId } = body;

    if (!productId || typeof productId !== 'number') {
      return NextResponse.json(
        { error: 'El ID del producto es requerido y debe ser un número' },
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

    // Check if wishlist item exists
    const existingWishlistItem = await db.select()
      .from(wishlists)
      .where(
        and(
          eq(wishlists.userId, userId),
          eq(wishlists.productId, productId)
        )
      )
      .limit(1);

    if (existingWishlistItem.length > 0) {
      // Remove from wishlist
      await db.delete(wishlists)
        .where(
          and(
            eq(wishlists.userId, userId),
            eq(wishlists.productId, productId)
          )
        );

      return NextResponse.json({
        inWishlist: false,
        message: 'Producto eliminado de la lista de deseos'
      }, { status: 200 });
    } else {
      // Add to wishlist
      await db.insert(wishlists)
        .values({
          userId,
          productId,
          createdAt: new Date().toISOString()
        });

      return NextResponse.json({
        inWishlist: true,
        message: 'Producto agregado a la lista de deseos'
      }, { status: 200 });
    }
  } catch (error) {
    console.error('POST /api/wishlist/toggle error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}