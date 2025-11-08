import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, orderItems, products, coupons, couponRedemptions } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

async function generateOrderNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const yearPrefix = `IW-${currentYear}-`;

  try {
    const latestOrder = await db
      .select({ orderNumber: orders.orderNumber })
      .from(orders)
      .where(sql`${orders.orderNumber} LIKE ${yearPrefix + '%'}`)
      .orderBy(desc(orders.orderNumber))
      .limit(1);

    let nextSequence = 1;

    if (latestOrder.length > 0) {
      const lastNumber = latestOrder[0].orderNumber;
      const sequencePart = lastNumber.split('-')[2];
      nextSequence = parseInt(sequencePart, 10) + 1;
    }

    const paddedSequence = nextSequence.toString().padStart(5, '0');
    return `${yearPrefix}${paddedSequence}`;
  } catch (error) {
    console.error('Error generating order number:', error);
    throw error;
  }
}

async function validateCoupon(
  couponCode: string,
  subtotal: number,
  userId: string | null,
  email: string
): Promise<{ valid: boolean; discountAmount: number; couponId?: number }> {
  try {
    const coupon = await db
      .select()
      .from(coupons)
      .where(and(eq(coupons.code, couponCode), eq(coupons.active, true)))
      .limit(1);

    if (coupon.length === 0) {
      return { valid: false, discountAmount: 0 };
    }

    const couponData = coupon[0];
    const now = new Date().toISOString();

    if (now < couponData.startDate) {
      return { valid: false, discountAmount: 0 };
    }

    if (couponData.endDate && now > couponData.endDate) {
      return { valid: false, discountAmount: 0 };
    }

    if (couponData.minPurchase && subtotal < couponData.minPurchase) {
      return { valid: false, discountAmount: 0 };
    }

    if (couponData.maxUses && couponData.currentUses >= couponData.maxUses) {
      return { valid: false, discountAmount: 0 };
    }

    if (couponData.oneTimePerUser) {
      const existingRedemption = await db
        .select()
        .from(couponRedemptions)
        .where(
          and(
            eq(couponRedemptions.couponId, couponData.id),
            userId ? eq(couponRedemptions.userId, userId) : eq(couponRedemptions.email, email)
          )
        )
        .limit(1);

      if (existingRedemption.length > 0) {
        return { valid: false, discountAmount: 0 };
      }
    }

    let discountAmount = 0;
    if (couponData.type === 'percentage') {
      discountAmount = (subtotal * couponData.value) / 100;
    } else if (couponData.type === 'fixed') {
      discountAmount = couponData.value;
    }

    discountAmount = Math.min(discountAmount, subtotal);

    return { valid: true, discountAmount, couponId: couponData.id };
  } catch (error) {
    console.error('Error validating coupon:', error);
    return { valid: false, discountAmount: 0 };
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');

    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const order = await db
        .select()
        .from(orders)
        .where(eq(orders.id, parseInt(id)))
        .limit(1);

      if (order.length === 0) {
        return NextResponse.json(
          { error: 'Order not found', code: 'ORDER_NOT_FOUND' },
          { status: 404 }
        );
      }

      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, parseInt(id)));

      return NextResponse.json({
        ...order[0],
        items,
      });
    }

    if (!userId && !email) {
      return NextResponse.json(
        { error: 'Either userId or email is required', code: 'MISSING_IDENTIFIER' },
        { status: 400 }
      );
    }

    let userOrders;
    if (userId) {
      userOrders = await db
        .select()
        .from(orders)
        .where(eq(orders.userId, userId))
        .orderBy(desc(orders.createdAt));
    } else if (email) {
      userOrders = await db
        .select()
        .from(orders)
        .where(eq(orders.guestEmail, email))
        .orderBy(desc(orders.createdAt));
    }

    if (!userOrders || userOrders.length === 0) {
      return NextResponse.json([]);
    }

    const ordersWithItems = await Promise.all(
      userOrders.map(async (order) => {
        const items = await db
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, order.id));

        return {
          ...order,
          items,
        };
      })
    );

    return NextResponse.json(ordersWithItems);
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, paymentMethod, shipping, userId, guestEmail, guestName, couponCode, paymentId } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'At least one item is required', code: 'MISSING_ITEMS' },
        { status: 400 }
      );
    }

    if (!paymentMethod || typeof paymentMethod !== 'string' || paymentMethod.trim() === '') {
      return NextResponse.json(
        { error: 'Payment method is required', code: 'MISSING_PAYMENT_METHOD' },
        { status: 400 }
      );
    }

    if (!shipping || typeof shipping !== 'object') {
      return NextResponse.json(
        { error: 'Shipping information is required', code: 'MISSING_SHIPPING' },
        { status: 400 }
      );
    }

    const requiredShippingFields = ['name', 'email', 'phone', 'address', 'city', 'postalCode', 'country'];
    for (const field of requiredShippingFields) {
      if (!shipping[field] || typeof shipping[field] !== 'string' || shipping[field].trim() === '') {
        return NextResponse.json(
          { error: `Shipping ${field} is required`, code: 'MISSING_SHIPPING_FIELD' },
          { status: 400 }
        );
      }
    }

    if (!userId && (!guestEmail || !guestName)) {
      return NextResponse.json(
        { error: 'Either userId or guest information (email and name) is required', code: 'MISSING_USER_INFO' },
        { status: 400 }
      );
    }

    for (const item of items) {
      if (!item.productId || typeof item.productId !== 'number') {
        return NextResponse.json(
          { error: 'Invalid product ID', code: 'INVALID_PRODUCT_ID' },
          { status: 400 }
        );
      }
      if (!item.quantity || typeof item.quantity !== 'number' || item.quantity <= 0) {
        return NextResponse.json(
          { error: 'Quantity must be greater than 0', code: 'INVALID_QUANTITY' },
          { status: 400 }
        );
      }
    }

    const productIds = items.map((item) => item.productId);
    const productsData = await db
      .select()
      .from(products)
      .where(sql`${products.id} IN ${sql.raw(`(${productIds.join(',')})`)}`);

    if (productsData.length !== productIds.length) {
      return NextResponse.json(
        { error: 'One or more products not found', code: 'PRODUCT_NOT_FOUND' },
        { status: 400 }
      );
    }

    const productMap = new Map(productsData.map((p) => [p.id, p]));

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Product with ID ${item.productId} not found`, code: 'PRODUCT_NOT_FOUND' },
          { status: 400 }
        );
      }
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for product: ${product.name}`, code: 'INSUFFICIENT_STOCK' },
          { status: 400 }
        );
      }
    }

    let subtotal = 0;
    const orderItemsData = items.map((item) => {
      const product = productMap.get(item.productId)!;
      const itemSubtotal = product.price * item.quantity;
      subtotal += itemSubtotal;

      return {
        productId: product.id,
        productName: product.name,
        productReference: product.reference,
        unitPrice: product.price,
        quantity: item.quantity,
        subtotal: itemSubtotal,
      };
    });

    let discountAmount = 0;
    let couponId: number | undefined;

    if (couponCode) {
      const couponValidation = await validateCoupon(
        couponCode,
        subtotal,
        userId || null,
        guestEmail || shipping.email
      );
      if (couponValidation.valid) {
        discountAmount = couponValidation.discountAmount;
        couponId = couponValidation.couponId;
      }
    }

    const total = subtotal - discountAmount;

    const orderNumber = await generateOrderNumber();

    const now = new Date().toISOString();

    const newOrder = await db
      .insert(orders)
      .values({
        orderNumber,
        userId: userId || null,
        guestEmail: guestEmail || null,
        guestName: guestName || null,
        subtotal,
        discountAmount,
        total,
        couponCode: couponCode || null,
        paymentMethod,
        paymentId: paymentId || null,
        status: 'pending',
        shippingName: shipping.name,
        shippingEmail: shipping.email,
        shippingPhone: shipping.phone,
        shippingAddress: shipping.address,
        shippingCity: shipping.city,
        shippingPostalCode: shipping.postalCode,
        shippingCountry: shipping.country,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    const createdOrder = newOrder[0];

    const orderItemsWithOrderId = orderItemsData.map((item) => ({
      ...item,
      orderId: createdOrder.id,
      createdAt: now,
    }));

    const createdOrderItems = await db.insert(orderItems).values(orderItemsWithOrderId).returning();

    for (const item of items) {
      const product = productMap.get(item.productId)!;
      await db
        .update(products)
        .set({
          stock: product.stock - item.quantity,
          updatedAt: now,
        })
        .where(eq(products.id, item.productId));
    }

    if (couponCode && couponId) {
      await db.insert(couponRedemptions).values({
        couponId,
        userId: userId || null,
        email: guestEmail || shipping.email,
        orderId: createdOrder.id,
        redeemedAt: now,
      });

      const currentCoupon = await db
        .select()
        .from(coupons)
        .where(eq(coupons.id, couponId))
        .limit(1);

      if (currentCoupon.length > 0) {
        await db
          .update(coupons)
          .set({
            currentUses: currentCoupon[0].currentUses + 1,
            updatedAt: now,
          })
          .where(eq(coupons.id, couponId));
      }
    }

    return NextResponse.json(
      {
        ...createdOrder,
        items: createdOrderItems,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required', code: 'MISSING_STATUS' },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'paid', 'processing', 'shipped', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value', code: 'INVALID_STATUS' },
        { status: 400 }
      );
    }

    const existingOrder = await db
      .select()
      .from(orders)
      .where(eq(orders.id, parseInt(id)))
      .limit(1);

    if (existingOrder.length === 0) {
      return NextResponse.json(
        { error: 'Order not found', code: 'ORDER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const updatedOrder = await db
      .update(orders)
      .set({
        status,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(orders.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedOrder[0]);
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}