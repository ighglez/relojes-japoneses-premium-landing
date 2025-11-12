// src/app/api/cart/update/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { cartItems, products } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest) {
  try {
    // 1) Identidad: user (auth) o guest (sessionId)
    const h = await headers();
    const session = await auth.api.getSession({ headers: h }).catch(() => null);
    const userId = session?.user?.id ?? null;

    const body = await request.json();
    const rawItemId = body?.itemId;
    const rawQty = body?.quantity;

    // sessionId: si no hay user, tomar del body o cabecera x-session-id
    const sessionIdFromBody: string | null = body?.sessionId ?? null;
    const sessionIdFromHeader = h.get("x-session-id") ?? null;
    const sessionId: string | null = userId ? null : (sessionIdFromBody || sessionIdFromHeader);

    // 2) Validación de inputs
    const itemId = Number(rawItemId);
    const quantity = Number(rawQty);

    if (!Number.isFinite(itemId) || itemId <= 0) {
      return NextResponse.json(
        { error: "ID del artículo del carrito inválido" },
        { status: 400 }
      );
    }
    if (!Number.isFinite(quantity)) {
      return NextResponse.json(
        { error: "Cantidad es requerida y debe ser numérica" },
        { status: 400 }
      );
    }
    if (!userId && (!sessionId || typeof sessionId !== "string")) {
      return NextResponse.json(
        { error: "Se requiere sessionId para invitados" },
        { status: 400 }
      );
    }

    // 3) Obtener cart item y verificar propiedad
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

    const belongsToUser = userId ? item.userId === userId : item.sessionId === sessionId;
    if (!belongsToUser) {
      // No revelamos existencia si no te pertenece
      return NextResponse.json(
        { error: "Artículo del carrito no encontrado" },
        { status: 404 }
      );
    }

    if (!item.productId) {
      return NextResponse.json(
        { error: "Producto no válido en el carrito" },
        { status: 400 }
      );
    }

    // 4) Si quantity === 0 ⇒ borrar el ítem (atajo)
    if (quantity === 0) {
      await db.delete(cartItems).where(eq(cartItems.id, itemId));
    } else {
      // Validar rango 1..10
      if (quantity < 1 || quantity > 10) {
        return NextResponse.json(
          { error: "La cantidad debe estar entre 1 y 10" },
          { status: 400 }
        );
      }

      // Comprobar stock del producto
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);

      if (!product) {
        return NextResponse.json(
          { error: "Producto no encontrado" },
          { status: 404 }
        );
      }
      if ((product.stock ?? 0) < quantity) {
        return NextResponse.json(
          { error: `Stock insuficiente. Disponible: ${product.stock ?? 0}` },
          { status: 400 }
        );
      }

      // 5) Actualizar cantidad
      await db
        .update(cartItems)
        .set({ quantity, updatedAt: new Date().toISOString() })
        .where(eq(cartItems.id, itemId));
    }

    // 6) Releer carrito y devolver resumen consistente
    const whereCart = userId
      ? eq(cartItems.userId, userId)
      : eq(cartItems.sessionId, sessionId!);

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
        productImagesJson: products.images, // fallback si imageUrl vacío
      })
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .where(whereCart);

    const items = rows.map((r) => {
      // fallback de imagen
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
        items,
        subtotal: Number(subtotal.toFixed(2)),
        itemCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /api/cart/update error:", error);
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
