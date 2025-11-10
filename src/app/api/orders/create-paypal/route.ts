import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { products } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

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
    const body = await request.json();
    const { items, currency = 'EUR', shippingAmount = 0 } = body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Los artículos del pedido son requeridos' },
        { status: 400 }
      );
    }

    // Server-side validation: fetch prices from database
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const { productId, quantity } = item;

      if (!productId || !quantity || quantity <= 0) {
        return NextResponse.json(
          { error: 'Artículos inválidos en el pedido' },
          { status: 400 }
        );
      }

      // Fetch product from database
      const product = await db.select()
        .from(products)
        .where(eq(products.id, productId))
        .limit(1);

      if (product.length === 0) {
        return NextResponse.json(
          { error: `Producto con ID ${productId} no encontrado` },
          { status: 404 }
        );
      }

      const dbProduct = product[0];

      // Verify stock availability
      if (dbProduct.stock < quantity) {
        return NextResponse.json(
          { error: `Stock insuficiente para ${dbProduct.name}` },
          { status: 400 }
        );
      }

      // Use database price (NEVER trust client)
      const itemTotal = dbProduct.price * quantity;
      subtotal += itemTotal;

      validatedItems.push({
        name: `${dbProduct.brand} ${dbProduct.name}`,
        quantity: quantity.toString(),
        unit_amount: {
          currency_code: currency,
          value: dbProduct.price.toFixed(2)
        }
      });
    }

    // Calculate total
    const total = subtotal + shippingAmount;

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Create PayPal order
    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: currency,
          value: total.toFixed(2),
          breakdown: {
            item_total: {
              currency_code: currency,
              value: subtotal.toFixed(2)
            },
            shipping: {
              currency_code: currency,
              value: shippingAmount.toFixed(2)
            }
          }
        },
        items: validatedItems
      }],
      application_context: {
        brand_name: 'IWatchWorks',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: `${process.env.NEXTAUTH_URL}/pago/exito`,
        cancel_url: `${process.env.NEXTAUTH_URL}/pago/cancelado`,
      }
    };

    const response = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Error de PayPal al crear orden:', error);
      throw new Error('Error al crear orden de PayPal');
    }

    const order = await response.json();

    return NextResponse.json({
      orderId: order.id
    }, { status: 200 });

  } catch (error) {
    console.error('POST /api/orders/create-paypal error:', error);
    return NextResponse.json(
      { error: 'Error al crear orden de PayPal: ' + (error as Error).message },
      { status: 500 }
    );
  }
}