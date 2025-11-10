import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { wishlists, products } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Debes iniciar sesión para ver la lista de deseos' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Query wishlists with products using LEFT JOIN
    const wishlistItems = await db
      .select({
        id: wishlists.id,
        productId: wishlists.productId,
        addedAt: wishlists.createdAt,
        product: {
          id: products.id,
          name: products.name,
          brand: products.brand,
          series: products.series,
          reference: products.reference,
          description: products.description,
          price: products.price,
          stock: products.stock,
          category: products.category,
          images: products.images,
          isFeatured: products.isFeatured,
        },
      })
      .from(wishlists)
      .leftJoin(products, eq(wishlists.productId, products.id))
      .where(eq(wishlists.userId, userId));

    // Transform the results to match the expected format
    const formattedWishlist = wishlistItems.map((item) => ({
      id: item.id,
      productId: item.productId,
      addedAt: item.addedAt,
      product: item.product,
    }));

    return NextResponse.json(formattedWishlist, { status: 200 });
  } catch (error) {
    console.error('GET /api/wishlist/get error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al obtener la lista de deseos' },
      { status: 500 }
    );
  }
}