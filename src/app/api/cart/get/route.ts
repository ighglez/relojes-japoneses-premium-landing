// src/app/api/cart/get/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { cartItems, products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const h = await headers();
    
    // Prioridad: 1. Query param, 2. Header, 3. null
    let guestSessionId = searchParams.get("sessionId") || h.get('x-session-id') || null;

    const session = await auth.api.getSession({ headers: h }).catch(() => null);
    const userId = session?.user?.id ?? null;

    // Si no hay nada para identificar al usuario, devolvemos carrito vacío sin error
    if (!userId && (!guestSessionId || guestSessionId === "null")) {
      return NextResponse.json({ items: [], subtotal: 0, itemCount: 0 });
    }

    const whereCondition = userId 
      ? eq(cartItems.userId, userId) 
      : eq(cartItems.sessionId, guestSessionId as string);

    const rows = await db
      .select({
        id: cartItems.id,
        productId: cartItems.productId,
        quantity: cartItems.quantity,
        p_id: products.id,
        p_name: products.name,
        p_brand: products.brand,
        p_price: products.price,
        p_imageUrl: products.imageUrl,
        p_images: products.images,
      })
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .where(whereCondition);

    let subtotal = 0;
    let itemCount = 0;

    const items = rows.map((r) => {
      if (!r.p_id) return null;
      
      const price = Number(r.p_price || 0);
      subtotal += price * r.quantity;
      itemCount += r.quantity;

      let imageUrl = r.p_imageUrl;
      if (!imageUrl && r.p_images) {
        try {
          const imgs = typeof r.p_images === 'string' ? JSON.parse(r.p_images) : r.p_images;
          imageUrl = Array.isArray(imgs) ? imgs[0] : imageUrl;
        } catch (e) {}
      }

      return {
        id: r.id,
        productId: r.productId,
        quantity: r.quantity,
        product: {
          id: r.p_id,
          name: r.p_name,
          brand: r.p_brand,
          price: price,
          imageUrl: imageUrl,
        },
      };
    }).filter(Boolean);

    return NextResponse.json({ 
      items, 
      subtotal: Number(subtotal.toFixed(2)), 
      itemCount 
    });
  } catch (error) {
    console.error("DETALLE ERROR CART:", error);
    return NextResponse.json({ error: "Error en servidor" }, { status: 500 });
  }
}
