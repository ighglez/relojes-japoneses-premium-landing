// src/app/api/cart/remove/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { cartItems, products } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(request: NextRequest) {
  try {
    // 1) Params: itemId (obligatorio) y sessionId (si es guest)
    const { searchParams } = new URL(request.url);
    const rawItemId = searchParams.get("itemId");
    const guestSessionId = searchParams.get("sessionId") ?? null;

    const itemId = Number(rawItemId);
    if (!Number.isFinite(itemId) || itemId <= 0) {
      return NextResponse.json(
        { error: "ID del artículo inválido" },
        { status: 400 }
      );
    }

    // 2) Identidad: user (auth) o guest (sessionId)
    const h = await headers();
    const session = await auth.api.getSession({ headers: h }).catch(() => null);
    const userId = session?.user?.id ?? null;

    if (!userId && !guestSessionId) {
      return NextResponse.json(
        { error: "Se requiere autenticación o sessionId para invitados" },
        { status: 400 }
      );
    }

    // 3) Leer el cart item y verificar propiedad
    const [item] = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.id, itemId))
      .limit(1);

    if (!item) {
      return NextResponse.json(
        { error: "Artículo del carrito no encontrado" },
        { status: 404 }
      );
    }

    const belongsToUser = userId ? item.userId === userId : item.sessionId === guestSessionId;
    if (!belongsToUser) {
      // No revelamos información si no te pertenece
      return NextResponse.json(
        { error: "Artículo del carrito no encontrado" },
        { status: 404 }
      );
    }

    // 4) Borrar con verificación de propiedad
    const delWhere = userId
      ? and(eq(cartItems.id, itemId), eq(cartItems.userId, userId))
      : and(eq(cartItems.id, itemId), eq(cartItems.sessionId, guestSessionId!));

    await db.delete(cartItems).where(delWhere);

    // 5) Releer carrito y devolver resumen consistente
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
        productName: products.name,
        productBrand: products.brand,
        productReference: products.reference,
        productPrice: products.price,
        productStock: products.stock,
        productImageUrl: products.imageUrl,
      })
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .where(whereCart);

    const items = rows.map((r) => ({
      id: r.id,
      productId: r.productId,
      quantity: r.quantity,
      product: {
        name: r.productName,
        brand: r.productBrand,
        reference: r.productReference,
        price: r.productPrice,
        stock: r.productStock,
        imageUrl: r.productImageUrl,
      },
    }));

    const subtotal = rows.reduce(
      (acc, r) => acc + ((r.productPrice ?? 0) * r.quantity),
      0
    );
    const itemCount = rows.reduce((acc, r) => acc + r.quantity, 0);

    return NextResponse.json(
      {
        ok: true,
        message: "Producto eliminado del carrito",
        items,
        subtotal: Number(subtotal.toFixed(2)),
        itemCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/cart/remove error:", error);
    return NextResponse.json(
      {
        error:
          "Error interno del servidor: " +
          (error instanceof Error ? error.message : "Error desconocido"),
      },
      { status: 500 }
    );
  }
}
