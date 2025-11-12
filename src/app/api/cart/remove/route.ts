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
    const { searchParams } = new URL(request.url);
    const rawItemId = searchParams.get("itemId");
    const allFlag = searchParams.get("all"); // si viene "true", vacía el carrito

    // sessionId: query o cabecera x-session-id (para guests)
    const sessionIdFromQuery = searchParams.get("sessionId");
    const h = await headers();
    const sessionIdFromHeader = h.get("x-session-id") ?? undefined;
    const guestSessionId = sessionIdFromQuery || sessionIdFromHeader || null;

    // Usuario autenticado (Better Auth)
    const session = await auth.api.getSession({ headers: h }).catch(() => null);
    const userId = session?.user?.id ?? null;

    if (!userId && !guestSessionId) {
      return NextResponse.json(
        { error: "Se requiere autenticación o sessionId para invitados" },
        { status: 400 }
      );
    }

    // --------- VACÍAR CARRITO COMPLETO ---------
    if (allFlag === "true") {
      const whereCart = userId
        ? eq(cartItems.userId, userId)
        : eq(cartItems.sessionId, guestSessionId!);

      await db.delete(cartItems).where(whereCart);

      // Devolver carrito vacío y totales a 0
      return NextResponse.json(
        {
          ok: true,
          message: "Carrito vaciado",
          items: [],
          subtotal: 0,
          itemCount: 0,
        },
        { status: 200 }
      );
    }

    // --------- BORRAR ITEM CONCRETO ---------
    const itemId = Number(rawItemId);
    if (!Number.isFinite(itemId) || itemId <= 0) {
      return NextResponse.json(
        { error: "ID del artículo inválido" },
        { status: 400 }
      );
    }

    // Leer el cart item
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

    // Verificar propiedad
    const belongsToUser = userId ? item.userId === userId : item.sessionId === guestSessionId;
    if (!belongsToUser) {
      // No revelamos info si no pertenece
      return NextResponse.json(
        { error: "Artículo del carrito no encontrado" },
        { status: 404 }
      );
    }

    // Borrar con verificación de propiedad
    const delWhere = userId
      ? and(eq(cartItems.id, itemId), eq(cartItems.userId, userId))
      : and(eq(cartItems.id, itemId), eq(cartItems.sessionId, guestSessionId!));

    await db.delete(cartItems).where(delWhere);

    // Releer carrito para devolver estado consistente
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
        productImagesJson: products.images, // posible JSON con array de imágenes
      })
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .where(whereCart);

    const items = rows.map((r) => {
      // fallback de imagen: si imageUrl no existe, intenta sacar la primera del JSON `images`
      let imageUrl = r.productImageUrl ?? null;
      if (!imageUrl && r.productImagesJson) {
        try {
          const arr = typeof r.productImagesJson === "string"
            ? JSON.parse(r.productImagesJson)
            : r.productImagesJson;
          if (Array.isArray(arr) && arr.length > 0) imageUrl = arr[0];
        } catch {
          // ignorar parse fallido
        }
      }

      return {
        id: r.id,
        productId: r.productId,
        quantity: r.quantity,
        product: {
          name: r.productName,
          brand: r.productBrand,
          reference: r.productReference,
          price: r.productPrice,
          stock: r.productStock,
          imageUrl,
        },
      };
    });

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
