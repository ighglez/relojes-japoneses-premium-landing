import paypal from "@paypal/checkout-server-sdk";

function environment() {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET!;

  if (process.env.NODE_ENV === "production") {
    return new paypal.core.LiveEnvironment(clientId, clientSecret);
  }
  return new paypal.core.SandboxEnvironment(clientId, clientSecret);
}

function client() {
  return new paypal.core.PayPalHttpClient(environment());
}

export interface CreateOrderRequest {
  items: Array<{
    name: string;
    quantity: number;
    unitAmount: string;
  }>;
  totalAmount: string;
  currency?: string;
}

export async function createPayPalOrder(request: CreateOrderRequest) {
  const paypalClient = client();
  const requestBody = new paypal.orders.OrdersCreateRequest();

  requestBody.prefer("return=representation");
  requestBody.requestBody({
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: request.currency || "EUR",
          value: request.totalAmount,
          breakdown: {
            item_total: {
              currency_code: request.currency || "EUR",
              value: request.totalAmount,
            },
          },
        },
        items: request.items.map((item) => ({
          name: item.name,
          quantity: item.quantity.toString(),
          unit_amount: {
            currency_code: request.currency || "EUR",
            value: item.unitAmount,
          },
        })),
      },
    ],
  });

  try {
    const order = await paypalClient.execute(requestBody);
    return {
      orderId: order.result.id,
      status: order.result.status,
    };
  } catch (error) {
    console.error("Error creating PayPal order:", error);
    throw new Error("Failed to create PayPal order");
  }
}

export async function capturePayPalOrder(orderId: string) {
  const paypalClient = client();
  const request = new paypal.orders.OrdersCaptureRequest(orderId);
  request.requestBody({});

  try {
    const capture = await paypalClient.execute(request);
    return {
      orderId: capture.result.id,
      status: capture.result.status,
      payerEmail: capture.result.payer?.email_address,
      payerName: capture.result.payer?.name?.given_name,
      amount: capture.result.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value,
    };
  } catch (error) {
    console.error("Error capturing PayPal order:", error);
    throw new Error("Failed to capture PayPal order");
  }
}
