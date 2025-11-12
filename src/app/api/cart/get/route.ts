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
    let guestSessionId = searchParams.get("sessionId") ?? null;

    const h = await headers();
    // NEW: si no vino en query, lee cabecera x-session-id
    if (!guestSessionId) {
      const hdr = h.get("x-session-id");
      if (hdr) guestSessionId = hdr;
    }

    const session = await auth.api.getSession({ headers: h }).catch(() => null);
    const userId = session?.user?.id ?? null;

    if (!userId && !guestSessionId) {
      return NextResponse.json(
        { items: [], subtotal: 0, itemCount: 0 },
        { status: 200 }
      );
    }

    const whereCart = userId
      ? eq(cartItems.userId, userId)
      : eq(cartItems.sessionId, guestSessionId!);

    const rows = await db
      .select({
        id: cartItems.id,
        productId: cartItems.productId,
        quantity: cartItems.quantity,
        createdAt: cartItems.createdAt,
        updatedAt: cartItems.updatedAt,
        p_id: products.id,
        p_name: products.name,
        p_brand: products.brand,
        p_reference: products.reference,
        p_price: products.price,
        p_stock: products.stock,
        p_images: products.images,
        p_imageUrl: products.imageUrl,
      })
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .where(whereCart);

    if (rows.length === 0) {
      return NextResponse.json(
        { items: [], subtotal: 0, itemCount: 0 },
        { status: 200 }
      );
    }

    let subtotal = 0;
    let itemCount = 0;

    const items = rows
      .map((r) => {
        if (!r.p_id) return null;
        let imageUrl: string | null = r.p_imageUrl ?? null;
        if (!imageUrl && r.p_images) {
          try {
            const imgs = typeof r.p_images === "string" ? JSON.parse(r.p_images) : r.p_images;
            if (Array.isArray(imgs) && typeof imgs[0] === "string") {
              imageUrl = imgs[0] as string;
            }
          } catch {}
        }
        const line = (r.p_price ?? 0) * r.quantity;
        subtotal += line;
        itemCount += r.quantity;

        return {
          id: r.id,
          productId: r.productId,
          quantity: r.quantity,
          product: {
            id: r.p_id,
            name: r.p_name,
            brand: r.p_brand,
            reference: r.p_reference,
            price: r.p_price,
            stock: r.p_stock,
            imageUrl,
          },
        };
      })
      .filter(Boolean);

    return NextResponse.json(
      { items, subtotal: Number(subtotal.toFixed(2)), itemCount },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/cart/get error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor: " + (error instanceof Error ? error.message : "Error desconocido") },
      { status: 500 }
    );
  }
}
