// Analytics tracking utility for IWatchWorks
// Tracks key e-commerce events: add_to_cart, begin_checkout, purchase

interface AnalyticsProduct {
  id: number;
  name: string;
  brand: string;
  reference: string;
  price: number;
  quantity: number;
}

interface AnalyticsEvent {
  event: string;
  timestamp: string;
  data: any;
}

// Track add to cart event
export function trackAddToCart(product: AnalyticsProduct) {
  const event: AnalyticsEvent = {
    event: "add_to_cart",
    timestamp: new Date().toISOString(),
    data: {
      product_id: product.id,
      product_name: product.name,
      product_brand: product.brand,
      product_reference: product.reference,
      price: product.price,
      quantity: product.quantity,
      value: product.price * product.quantity,
      currency: "EUR",
    },
  };

  // Log to console (in production, send to analytics service like Google Analytics, Mixpanel, etc.)
  console.log("[Analytics] add_to_cart:", event);

  // Store event in localStorage for demo purposes
  storeEvent(event);

  // Send to Google Analytics 4 if available
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", "add_to_cart", {
      currency: "EUR",
      value: event.data.value,
      items: [
        {
          item_id: product.reference,
          item_name: product.name,
          item_brand: product.brand,
          price: product.price,
          quantity: product.quantity,
        },
      ],
    });
  }

  return event;
}

// Track begin checkout event
export function trackBeginCheckout(items: AnalyticsProduct[], total: number) {
  const event: AnalyticsEvent = {
    event: "begin_checkout",
    timestamp: new Date().toISOString(),
    data: {
      items: items.map((item) => ({
        product_id: item.id,
        product_name: item.name,
        product_brand: item.brand,
        product_reference: item.reference,
        price: item.price,
        quantity: item.quantity,
      })),
      item_count: items.reduce((sum, item) => sum + item.quantity, 0),
      total_value: total,
      currency: "EUR",
    },
  };

  console.log("[Analytics] begin_checkout:", event);
  storeEvent(event);

  // Send to Google Analytics 4 if available
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", "begin_checkout", {
      currency: "EUR",
      value: total,
      items: items.map((item) => ({
        item_id: item.reference,
        item_name: item.name,
        item_brand: item.brand,
        price: item.price,
        quantity: item.quantity,
      })),
    });
  }

  return event;
}

// Track purchase event
export function trackPurchase(
  orderId: string,
  items: AnalyticsProduct[],
  subtotal: number,
  discount: number,
  total: number,
  couponCode?: string
) {
  const event: AnalyticsEvent = {
    event: "purchase",
    timestamp: new Date().toISOString(),
    data: {
      transaction_id: orderId,
      items: items.map((item) => ({
        product_id: item.id,
        product_name: item.name,
        product_brand: item.brand,
        product_reference: item.reference,
        price: item.price,
        quantity: item.quantity,
      })),
      item_count: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
      discount,
      total_value: total,
      currency: "EUR",
      coupon: couponCode || null,
    },
  };

  console.log("[Analytics] purchase:", event);
  storeEvent(event);

  // Send to Google Analytics 4 if available
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", "purchase", {
      transaction_id: orderId,
      value: total,
      currency: "EUR",
      coupon: couponCode,
      items: items.map((item) => ({
        item_id: item.reference,
        item_name: item.name,
        item_brand: item.brand,
        price: item.price,
        quantity: item.quantity,
      })),
    });
  }

  return event;
}

// Track product view
export function trackProductView(product: {
  id: number;
  name: string;
  brand: string;
  reference: string;
  price: number;
  category: string;
}) {
  const event: AnalyticsEvent = {
    event: "view_item",
    timestamp: new Date().toISOString(),
    data: {
      product_id: product.id,
      product_name: product.name,
      product_brand: product.brand,
      product_reference: product.reference,
      price: product.price,
      category: product.category,
      currency: "EUR",
    },
  };

  console.log("[Analytics] view_item:", event);
  storeEvent(event);

  // Send to Google Analytics 4 if available
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", "view_item", {
      currency: "EUR",
      value: product.price,
      items: [
        {
          item_id: product.reference,
          item_name: product.name,
          item_brand: product.brand,
          item_category: product.category,
          price: product.price,
        },
      ],
    });
  }

  return event;
}

// Store event in localStorage for demo/debugging
function storeEvent(event: AnalyticsEvent) {
  if (typeof window === "undefined") return;

  try {
    const key = "iwatchworks_analytics_events";
    const stored = localStorage.getItem(key);
    const events = stored ? JSON.parse(stored) : [];

    // Keep only last 100 events
    events.push(event);
    if (events.length > 100) {
      events.shift();
    }

    localStorage.setItem(key, JSON.stringify(events));
  } catch (error) {
    console.error("Error storing analytics event:", error);
  }
}

// Get all stored events (for debugging/admin panel)
export function getStoredEvents(): AnalyticsEvent[] {
  if (typeof window === "undefined") return [];

  try {
    const key = "iwatchworks_analytics_events";
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error retrieving analytics events:", error);
    return [];
  }
}

// Clear stored events
export function clearStoredEvents() {
  if (typeof window === "undefined") return;

  try {
    const key = "iwatchworks_analytics_events";
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Error clearing analytics events:", error);
  }
}
