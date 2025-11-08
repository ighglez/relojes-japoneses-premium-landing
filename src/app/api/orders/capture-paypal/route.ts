import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, orderItems, products, coupons, couponRedemptions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const PAYPAL_API = process.env.PAYPAL_MODE === 'live' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com';

async function getPayPalAccessToken() {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error('Failed to get PayPal access token');
  }

  const data = await response.json();
  return data.access_token;
}

async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `IW-${year}-${timestamp}${random}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      paypalOrderId,
      items,
      subtotal,
      discountAmount = 0,
      total,
      couponCode,
      shippingInfo,
    } = body;

    if (!paypalOrderId) {
      return NextResponse.json(
        { error: 'PayPal order ID is required' },
        { status: 400 }
      );
    }

    // Get user info from token
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    let userId: string | null = null;

    if (token) {
      try {
        const sessionResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/get-session`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          userId = sessionData.session?.userId || null;
        }
      } catch (error) {
        console.log('No user session found, proceeding as guest');
      }
    }

    // Capture PayPal order
    const accessToken = await getPayPalAccessToken();

    const captureResponse = await fetch(
      `${PAYPAL_API}/v2/checkout/orders/${paypalOrderId}/capture`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!captureResponse.ok) {
      const error = await captureResponse.json();
      console.error('PayPal capture error:', error);
      throw new Error('Failed to capture PayPal payment');
    }

    const captureData = await captureResponse.json();

    if (captureData.status !== 'COMPLETED') {
      throw new Error('PayPal payment not completed');
    }

    // Generate order number
    const orderNumber = await generateOrderNumber();
    const now = new Date().toISOString();

    // Validate coupon if provided
    let couponId: number | undefined;
    if (couponCode) {
      const couponResult = await db
        .select()
        .from(coupons)
        .where(and(eq(coupons.code, couponCode.toUpperCase()), eq(coupons.active, true)))
        .limit(1);

      if (couponResult.length > 0) {
        couponId = couponResult[0].id;
      }
    }

    // Create order in database
    const newOrder = await db
      .insert(orders)
      .values({
        orderNumber,
        userId: userId || null,
        guestEmail: !userId ? shippingInfo.email : null,
        guestName: !userId ? shippingInfo.name : null,
        subtotal,
        discountAmount,
        total,
        couponCode: couponCode || null,
        paymentMethod: 'paypal',
        paymentId: paypalOrderId,
        status: 'paid',
        shippingName: shippingInfo.name,
        shippingEmail: shippingInfo.email,
        shippingPhone: shippingInfo.phone,
        shippingAddress: shippingInfo.address,
        shippingCity: shippingInfo.city,
        shippingPostalCode: shippingInfo.postalCode,
        shippingCountry: shippingInfo.country,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    const createdOrder = newOrder[0];

    // Create order items
    const orderItemsData = items.map((item: any) => ({
      orderId: createdOrder.id,
      productId: item.productId,
      productName: item.productName,
      productReference: item.productReference,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      subtotal: item.unitPrice * item.quantity,
      createdAt: now,
    }));

    await db.insert(orderItems).values(orderItemsData);

    // Update product stock
    for (const item of items) {
      const product = await db
        .select()
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);

      if (product.length > 0) {
        await db
          .update(products)
          .set({
            stock: product[0].stock - item.quantity,
            updatedAt: now,
          })
          .where(eq(products.id, item.productId));
      }
    }

    // Record coupon redemption
    if (couponId) {
      await db.insert(couponRedemptions).values({
        couponId,
        userId: userId || null,
        email: shippingInfo.email,
        orderId: createdOrder.id,
        redeemedAt: now,
      });

      // Update coupon usage count
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

    return NextResponse.json({
      success: true,
      orderId: createdOrder.id,
      orderNumber: createdOrder.orderNumber,
      paypalOrderId: captureData.id,
    });

  } catch (error) {
    console.error('Capture PayPal order error:', error);
    return NextResponse.json(
      { error: 'Failed to capture PayPal order: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
