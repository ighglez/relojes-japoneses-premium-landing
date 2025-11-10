import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { cartItems, products, session } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const authHeader = request.headers.get('authorization');

    let userId: string | null = null;

    // Check for authentication via Bearer token
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

    // If neither authenticated nor guest session, return empty cart
    if (!userId && !sessionId) {
      return NextResponse.json({
        items: [],
        subtotal: 0,
        itemCount: 0
      });
    }

    // Query cart items with product details using LEFT JOIN
    // Filter by userId (authenticated) or sessionId (guest)
    let results;
    if (userId) {
      results = await db.select({
        cartItem: cartItems,
        product: products
      })
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, userId));
    } else if (sessionId) {
      results = await db.select({
        cartItem: cartItems,
        product: products
      })
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.sessionId, sessionId));
    } else {
      return NextResponse.json({
        items: [],
        subtotal: 0,
        itemCount: 0
      });
    }

    // If no items found, return empty cart
    if (results.length === 0) {
      return NextResponse.json({
        items: [],
        subtotal: 0,
        itemCount: 0
      });
    }

    // Transform results and calculate totals
    let subtotal = 0;
    let itemCount = 0;

    const items = results.map(row => {
      const { cartItem, product } = row;

      // Handle missing product
      if (!product) {
        return null;
      }

      const itemSubtotal = product.price * cartItem.quantity;
      subtotal += itemSubtotal;
      itemCount += cartItem.quantity;

      // Get first image from images array
      let imageUrl = null;
      if (product.images) {
        const imagesArray = typeof product.images === 'string' 
          ? JSON.parse(product.images) 
          : product.images;
        if (Array.isArray(imagesArray) && imagesArray.length > 0) {
          imageUrl = imagesArray[0];
        }
      }

      return {
        id: cartItem.id,
        productId: cartItem.productId,
        quantity: cartItem.quantity,
        product: {
          id: product.id,
          name: product.name,
          brand: product.brand,
          reference: product.reference,
          price: product.price,
          stock: product.stock,
          imageUrl
        },
        subtotal: itemSubtotal
      };
    }).filter(item => item !== null);

    return NextResponse.json({
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      itemCount
    });

  } catch (error) {
    console.error('GET cart error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor: ' + (error as Error).message },
      { status: 500 }
    );
  }
}