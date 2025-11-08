import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { cartItems, products } from '@/db/schema';
import { eq, and, or, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');

    // Return empty cart if no identifier provided
    if (!userId && !sessionId) {
      return NextResponse.json({ 
        items: [], 
        cartTotal: 0, 
        itemCount: 0 
      }, { status: 200 });
    }

    // Build where condition based on provided identifier
    const whereCondition = userId 
      ? eq(cartItems.userId, userId)
      : eq(cartItems.sessionId, sessionId!);

    // Get cart items with product details using LEFT JOIN
    const items = await db
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
      })
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .where(whereCondition);

    // Calculate cart total and item count
    const cartTotal = items.reduce((sum, item) => {
      return sum + ((item.productPrice || 0) * item.quantity);
    }, 0);

    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    // Format response
    const formattedItems = items.map(item => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      product: {
        name: item.productName,
        brand: item.productBrand,
        reference: item.productReference,
        price: item.productPrice,
        stock: item.productStock,
        imageUrl: item.productImageUrl,
      }
    }));

    return NextResponse.json({
      items: formattedItems,
      cartTotal: Math.round(cartTotal * 100) / 100,
      itemCount
    }, { status: 200 });

  } catch (error) {
    console.error('GET cart error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, quantity = 1, userId, sessionId } = body;

    // Validate required identification
    if (!userId && !sessionId) {
      return NextResponse.json({ 
        error: "Either userId or sessionId is required",
        code: "MISSING_IDENTIFIER" 
      }, { status: 400 });
    }

    // Validate productId
    if (!productId) {
      return NextResponse.json({ 
        error: "Product ID is required",
        code: "MISSING_PRODUCT_ID" 
      }, { status: 400 });
    }

    // Validate quantity
    if (quantity < 1 || quantity > 10) {
      return NextResponse.json({ 
        error: "Quantity must be between 1 and 10",
        code: "INVALID_QUANTITY" 
      }, { status: 400 });
    }

    // Check if product exists and has sufficient stock
    const product = await db.select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (product.length === 0) {
      return NextResponse.json({ 
        error: "Product not found",
        code: "PRODUCT_NOT_FOUND" 
      }, { status: 404 });
    }

    if (product[0].stock < quantity) {
      return NextResponse.json({ 
        error: "Insufficient stock available",
        code: "INSUFFICIENT_STOCK" 
      }, { status: 400 });
    }

    // Check if item already exists in cart
    const whereCondition = userId
      ? and(eq(cartItems.userId, userId), eq(cartItems.productId, productId))
      : and(eq(cartItems.sessionId, sessionId!), eq(cartItems.productId, productId));

    const existingItem = await db.select()
      .from(cartItems)
      .where(whereCondition)
      .limit(1);

    if (existingItem.length > 0) {
      // Update existing item - add to quantity
      const newQuantity = existingItem[0].quantity + quantity;

      // Check if new quantity exceeds limit
      if (newQuantity > 10) {
        return NextResponse.json({ 
          error: "Cannot add more items. Maximum quantity per product is 10",
          code: "QUANTITY_LIMIT_EXCEEDED" 
        }, { status: 400 });
      }

      // Check if new quantity exceeds stock
      if (product[0].stock < newQuantity) {
        return NextResponse.json({ 
          error: "Insufficient stock available",
          code: "INSUFFICIENT_STOCK" 
        }, { status: 400 });
      }

      const updated = await db.update(cartItems)
        .set({
          quantity: newQuantity,
          updatedAt: new Date().toISOString()
        })
        .where(whereCondition)
        .returning();

      return NextResponse.json(updated[0], { status: 201 });
    }

    // Insert new cart item
    const newItem = await db.insert(cartItems)
      .values({
        userId: userId || null,
        sessionId: sessionId || null,
        productId,
        quantity,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .returning();

    return NextResponse.json(newItem[0], { status: 201 });

  } catch (error) {
    console.error('POST cart error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid cart item ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const body = await request.json();
    const { quantity } = body;

    // Validate quantity
    if (!quantity) {
      return NextResponse.json({ 
        error: "Quantity is required",
        code: "MISSING_QUANTITY" 
      }, { status: 400 });
    }

    if (quantity < 1 || quantity > 10) {
      return NextResponse.json({ 
        error: "Quantity must be between 1 and 10",
        code: "INVALID_QUANTITY" 
      }, { status: 400 });
    }

    // Check if cart item exists
    const cartItem = await db.select()
      .from(cartItems)
      .where(eq(cartItems.id, parseInt(id)))
      .limit(1);

    if (cartItem.length === 0) {
      return NextResponse.json({ 
        error: "Cart item not found",
        code: "CART_ITEM_NOT_FOUND" 
      }, { status: 404 });
    }

    // Check product stock availability
    const product = await db.select()
      .from(products)
      .where(eq(products.id, cartItem[0].productId!))
      .limit(1);

    if (product.length === 0) {
      return NextResponse.json({ 
        error: "Product not found",
        code: "PRODUCT_NOT_FOUND" 
      }, { status: 404 });
    }

    if (product[0].stock < quantity) {
      return NextResponse.json({ 
        error: "Insufficient stock available",
        code: "INSUFFICIENT_STOCK" 
      }, { status: 400 });
    }

    // Update cart item
    const updated = await db.update(cartItems)
      .set({
        quantity,
        updatedAt: new Date().toISOString()
      })
      .where(eq(cartItems.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });

  } catch (error) {
    console.error('PUT cart error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');

    // Handle single item deletion
    if (id) {
      // Validate ID
      if (isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid cart item ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      // Check if cart item exists
      const cartItem = await db.select()
        .from(cartItems)
        .where(eq(cartItems.id, parseInt(id)))
        .limit(1);

      if (cartItem.length === 0) {
        return NextResponse.json({ 
          error: "Cart item not found",
          code: "CART_ITEM_NOT_FOUND" 
        }, { status: 404 });
      }

      // Delete cart item
      await db.delete(cartItems)
        .where(eq(cartItems.id, parseInt(id)))
        .returning();

      return NextResponse.json({ 
        message: "Item removed from cart" 
      }, { status: 200 });
    }

    // Handle clear entire cart
    if (!userId && !sessionId) {
      return NextResponse.json({ 
        error: "Either userId or sessionId is required to clear cart",
        code: "MISSING_IDENTIFIER" 
      }, { status: 400 });
    }

    // Build where condition based on provided identifier
    const whereCondition = userId 
      ? eq(cartItems.userId, userId)
      : eq(cartItems.sessionId, sessionId!);

    // Delete all cart items for user/session
    const deleted = await db.delete(cartItems)
      .where(whereCondition)
      .returning();

    return NextResponse.json({ 
      message: "Cart cleared",
      deletedCount: deleted.length
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE cart error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}