import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, orderItems, products, coupons, couponRedemptions, cartItems } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAYPAL_API = process.env.PAYPAL_MODE === 'live' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com';

async function getPayPalAccessToken() {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Credenciales de PayPal no configuradas');
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
    throw new Error('Error al obtener token de acceso de PayPal');
  }

  const data = await response.json();
  return data.access_token;
}

export async function POST(request: NextRequest) {
  try {
    // Optional authentication
    let userId: string | null = null;
    try {
      const session = await auth.api.getSession({
        headers: await headers()
      });
      if (session?.user?.id) {
        userId = session.user.id;
      }
    } catch (error) {
      // Not authenticated, guest checkout
    }

    const body = await request.json();
    const {
      paypalOrderId,
      items,
      subtotal,
      discountAmount,
      shippingCost,
      total,
      couponCode,
      shippingInfo,
      sessionId
    } = body;

    if (!paypalOrderId) {
      return NextResponse.json(
        { error: 'ID de orden de PayPal es requerido' },
        { status: 400 }
      );
    }

    if (!shippingInfo || !shippingInfo.name || !shippingInfo.email) {
      return NextResponse.json(
        { error: 'Información de envío es requerida' },
        { status: 400 }
      );
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
      console.error('Error al capturar pago de PayPal:', error);
      throw new Error('Error al capturar pago de PayPal');
    }

    const captureData = await captureResponse.json();

    if (captureData.status !== 'COMPLETED') {
      throw new Error('Pago de PayPal no completado');
    }

    // Extract PayPal transaction ID
    const paypalTransactionId = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id || paypalOrderId;

    // Generate order number
    const year = new Date().getFullYear();
    const randomFiveDigits = Math.floor(10000 + Math.random() * 90000);
    const orderNumber = `IW-${year}-${randomFiveDigits}`;
    
    const now = new Date().toISOString();

    // Create order in database
    const newOrder = await db
      .insert(orders)
      .values({
        orderNumber,
        userId: userId || null,
        guestEmail: !userId ? shippingInfo.email : null,
        guestName: !userId ? shippingInfo.name : null,
        subtotal: subtotal || 0,
        discountAmount: discountAmount || 0,
        total,
        couponCode: couponCode || null,
        paymentMethod: 'paypal',
        paymentId: paypalOrderId,
        status: 'completed',
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
    if (items && items.length > 0) {
      const orderItemsData = items.map((item: any) => ({
        orderId: createdOrder.id,
        productId: item.productId,
        productName: item.name || item.productName,
        productReference: item.reference || item.productReference,
        unitPrice: item.price || item.unitPrice,
        quantity: item.quantity,
        subtotal: (item.price || item.unitPrice) * item.quantity,
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
    }

    // Record coupon redemption
    if (couponCode) {
      const couponResult = await db
        .select()
        .from(coupons)
        .where(eq(coupons.code, couponCode.toUpperCase()))
        .limit(1);

      if (couponResult.length > 0) {
        const coupon = couponResult[0];
        
        await db.insert(couponRedemptions).values({
          couponId: coupon.id,
          userId: userId || null,
          email: shippingInfo.email,
          orderId: createdOrder.id,
          redeemedAt: now,
        });

        // Update coupon usage count
        await db
          .update(coupons)
          .set({
            currentUses: coupon.currentUses + 1,
            updatedAt: now,
          })
          .where(eq(coupons.id, coupon.id));
      }
    }

    // Clear cart
    if (userId) {
      await db.delete(cartItems).where(eq(cartItems.userId, userId));
    } else if (sessionId) {
      await db.delete(cartItems).where(eq(cartItems.sessionId, sessionId));
    }

    return NextResponse.json({
      success: true,
      orderId: createdOrder.id,
      orderNumber: createdOrder.orderNumber,
      paypalTransactionId
    });

  } catch (error) {
    console.error('Error al capturar orden de PayPal:', error);
    return NextResponse.json(
      { error: 'Error al capturar orden de PayPal: ' + (error as Error).message },
      { status: 500 }
    );
  }
}