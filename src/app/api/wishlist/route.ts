import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { wishlists, products } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Get single wishlist item by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: 'Valid ID is required',
          code: 'INVALID_ID' 
        }, { status: 400 });
      }

      const wishlistItem = await db
        .select({
          id: wishlists.id,
          userId: wishlists.userId,
          productId: wishlists.productId,
          createdAt: wishlists.createdAt,
          product: {
            id: products.id,
            name: products.name,
            brand: products.brand,
            reference: products.reference,
            description: products.description,
            imageUrl: products.imageUrl,
            price: products.price,
            stock: products.stock,
            category: products.category,
            features: products.features,
            isFeatured: products.isFeatured,
          }
        })
        .from(wishlists)
        .leftJoin(products, eq(wishlists.productId, products.id))
        .where(and(
          eq(wishlists.id, parseInt(id)),
          eq(wishlists.userId, user.id)
        ))
        .limit(1);

      if (wishlistItem.length === 0) {
        return NextResponse.json({ 
          error: 'Wishlist item not found',
          code: 'NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(wishlistItem[0], { status: 200 });
    }

    // Get user's entire wishlist
    const wishlistItems = await db
      .select({
        id: wishlists.id,
        userId: wishlists.userId,
        productId: wishlists.productId,
        createdAt: wishlists.createdAt,
        product: {
          id: products.id,
          name: products.name,
          brand: products.brand,
          reference: products.reference,
          description: products.description,
          imageUrl: products.imageUrl,
          price: products.price,
          stock: products.stock,
          category: products.category,
          features: products.features,
          isFeatured: products.isFeatured,
        }
      })
      .from(wishlists)
      .leftJoin(products, eq(wishlists.productId, products.id))
      .where(eq(wishlists.userId, user.id))
      .orderBy(desc(wishlists.createdAt));

    return NextResponse.json({
      items: wishlistItems,
      itemCount: wishlistItems.length
    }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();

    // Security check: reject if userId provided in body
    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    const { productId } = body;

    // Validate required fields
    if (!productId) {
      return NextResponse.json({ 
        error: 'Product ID is required',
        code: 'MISSING_PRODUCT_ID' 
      }, { status: 400 });
    }

    // Check if product exists
    const product = await db
      .select()
      .from(products)
      .where(eq(products.id, parseInt(productId)))
      .limit(1);

    if (product.length === 0) {
      return NextResponse.json({ 
        error: 'Product not found',
        code: 'PRODUCT_NOT_FOUND' 
      }, { status: 404 });
    }

    // Check if product is already in user's wishlist
    const existingWishlistItem = await db
      .select()
      .from(wishlists)
      .where(and(
        eq(wishlists.userId, user.id),
        eq(wishlists.productId, parseInt(productId))
      ))
      .limit(1);

    if (existingWishlistItem.length > 0) {
      return NextResponse.json({ 
        error: 'Product already in wishlist',
        code: 'DUPLICATE_ENTRY' 
      }, { status: 400 });
    }

    // Insert new wishlist item
    const newWishlistItem = await db
      .insert(wishlists)
      .values({
        userId: user.id,
        productId: parseInt(productId),
        createdAt: new Date().toISOString()
      })
      .returning();

    // Fetch the complete wishlist item with product details
    const completeWishlistItem = await db
      .select({
        id: wishlists.id,
        userId: wishlists.userId,
        productId: wishlists.productId,
        createdAt: wishlists.createdAt,
        product: {
          id: products.id,
          name: products.name,
          brand: products.brand,
          reference: products.reference,
          description: products.description,
          imageUrl: products.imageUrl,
          price: products.price,
          stock: products.stock,
          category: products.category,
          features: products.features,
          isFeatured: products.isFeatured,
        }
      })
      .from(wishlists)
      .leftJoin(products, eq(wishlists.productId, products.id))
      .where(eq(wishlists.id, newWishlistItem[0].id))
      .limit(1);

    return NextResponse.json(completeWishlistItem[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    
    // Handle UNIQUE constraint violations
    if ((error as Error).message.includes('UNIQUE constraint failed')) {
      return NextResponse.json({ 
        error: 'Product already in wishlist',
        code: 'DUPLICATE_ENTRY' 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const productId = searchParams.get('productId');

    // Clear entire wishlist for user
    if (!id && !productId) {
      const deletedItems = await db
        .delete(wishlists)
        .where(eq(wishlists.userId, user.id))
        .returning();

      return NextResponse.json({
        message: 'Wishlist cleared',
        deletedCount: deletedItems.length
      }, { status: 200 });
    }

    // Delete by wishlist item ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: 'Valid ID is required',
          code: 'INVALID_ID' 
        }, { status: 400 });
      }

      const deletedItem = await db
        .delete(wishlists)
        .where(and(
          eq(wishlists.id, parseInt(id)),
          eq(wishlists.userId, user.id)
        ))
        .returning();

      if (deletedItem.length === 0) {
        return NextResponse.json({ 
          error: 'Wishlist item not found',
          code: 'NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json({
        message: 'Product removed from wishlist'
      }, { status: 200 });
    }

    // Delete by userId + productId combination
    if (productId) {
      if (isNaN(parseInt(productId))) {
        return NextResponse.json({ 
          error: 'Valid product ID is required',
          code: 'INVALID_PRODUCT_ID' 
        }, { status: 400 });
      }

      const deletedItem = await db
        .delete(wishlists)
        .where(and(
          eq(wishlists.userId, user.id),
          eq(wishlists.productId, parseInt(productId))
        ))
        .returning();

      if (deletedItem.length === 0) {
        return NextResponse.json({ 
          error: 'Wishlist item not found',
          code: 'NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json({
        message: 'Product removed from wishlist'
      }, { status: 200 });
    }

    return NextResponse.json({ 
      error: 'Either id or productId must be provided',
      code: 'MISSING_PARAMETER' 
    }, { status: 400 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}