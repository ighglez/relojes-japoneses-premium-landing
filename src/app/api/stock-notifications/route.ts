import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { stockNotifications, products } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single notification by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const notification = await db.select({
        id: stockNotifications.id,
        productId: stockNotifications.productId,
        email: stockNotifications.email,
        notified: stockNotifications.notified,
        createdAt: stockNotifications.createdAt,
        notifiedAt: stockNotifications.notifiedAt,
        product: {
          id: products.id,
          name: products.name,
          brand: products.brand,
          reference: products.reference,
          stock: products.stock,
        }
      })
        .from(stockNotifications)
        .leftJoin(products, eq(stockNotifications.productId, products.id))
        .where(eq(stockNotifications.id, parseInt(id)))
        .limit(1);

      if (notification.length === 0) {
        return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
      }

      return NextResponse.json(notification[0], { status: 200 });
    }

    // List all notifications with filters
    const productId = searchParams.get('productId');
    const notifiedParam = searchParams.get('notified');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    let query = db.select({
      id: stockNotifications.id,
      productId: stockNotifications.productId,
      email: stockNotifications.email,
      notified: stockNotifications.notified,
      createdAt: stockNotifications.createdAt,
      notifiedAt: stockNotifications.notifiedAt,
      product: {
        id: products.id,
        name: products.name,
        brand: products.brand,
        reference: products.reference,
        stock: products.stock,
      }
    })
      .from(stockNotifications)
      .leftJoin(products, eq(stockNotifications.productId, products.id))
      .orderBy(desc(stockNotifications.createdAt));

    const conditions = [];

    if (productId) {
      conditions.push(eq(stockNotifications.productId, parseInt(productId)));
    }

    if (notifiedParam !== null) {
      const notifiedValue = notifiedParam === 'true';
      conditions.push(eq(stockNotifications.notified, notifiedValue));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, email } = body;

    // Validation
    if (!productId) {
      return NextResponse.json({ 
        error: "Product ID is required",
        code: "MISSING_PRODUCT_ID" 
      }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ 
        error: "Email is required",
        code: "MISSING_EMAIL" 
      }, { status: 400 });
    }

    // Basic email validation
    const emailTrimmed = email.trim().toLowerCase();
    if (!emailTrimmed.includes('@') || !emailTrimmed.includes('.')) {
      return NextResponse.json({ 
        error: "Invalid email format",
        code: "INVALID_EMAIL" 
      }, { status: 400 });
    }

    if (emailTrimmed.length > 160) {
      return NextResponse.json({ 
        error: "Email must be 160 characters or less",
        code: "EMAIL_TOO_LONG" 
      }, { status: 400 });
    }

    // Check if product exists
    const product = await db.select()
      .from(products)
      .where(eq(products.id, parseInt(productId)))
      .limit(1);

    if (product.length === 0) {
      return NextResponse.json({ 
        error: "Product not found",
        code: "PRODUCT_NOT_FOUND" 
      }, { status: 404 });
    }

    // Check if product is currently in stock
    if (product[0].stock > 0) {
      return NextResponse.json({ 
        error: "Product is currently in stock",
        code: "PRODUCT_IN_STOCK" 
      }, { status: 400 });
    }

    // Check for existing notification subscription
    const existingNotification = await db.select()
      .from(stockNotifications)
      .where(
        and(
          eq(stockNotifications.productId, parseInt(productId)),
          eq(stockNotifications.email, emailTrimmed)
        )
      )
      .orderBy(desc(stockNotifications.createdAt))
      .limit(1);

    if (existingNotification.length > 0 && !existingNotification[0].notified) {
      return NextResponse.json({ 
        message: "You're already subscribed for notifications"
      }, { status: 200 });
    }

    // Create new notification request
    const newNotification = await db.insert(stockNotifications)
      .values({
        productId: parseInt(productId),
        email: emailTrimmed,
        notified: false,
        createdAt: new Date().toISOString(),
        notifiedAt: null,
      })
      .returning();

    return NextResponse.json({ 
      message: "You'll be notified when this product is back in stock",
      notification: newNotification[0]
    }, { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const productId = searchParams.get('productId');

    // Batch delete by productId
    if (productId) {
      if (isNaN(parseInt(productId))) {
        return NextResponse.json({ 
          error: "Valid product ID is required",
          code: "INVALID_PRODUCT_ID" 
        }, { status: 400 });
      }

      const deleted = await db.delete(stockNotifications)
        .where(eq(stockNotifications.productId, parseInt(productId)))
        .returning();

      return NextResponse.json({ 
        message: `Deleted ${deleted.length} notifications`,
        deletedCount: deleted.length
      }, { status: 200 });
    }

    // Single notification delete by id
    if (!id) {
      return NextResponse.json({ 
        error: "ID or productId is required",
        code: "MISSING_IDENTIFIER" 
      }, { status: 400 });
    }

    if (isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const deleted = await db.delete(stockNotifications)
      .where(eq(stockNotifications.id, parseInt(id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ 
        error: 'Notification not found',
        code: 'NOTIFICATION_NOT_FOUND' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      message: "Notification subscription cancelled"
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}