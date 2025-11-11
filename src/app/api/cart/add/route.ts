// src/app/api/cart/add/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { cartItems, products } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // 1) Identidad: user (auth) o guest (sessionId)
    const h = await headers();
    const session = await auth.api.getSession({ headers: h }).catch(() => null);
    const userId = session?.user?.id ?? null;

    const body = await request.json();
    const rawProductId = body?.productId;
    const rawQty = body?.quantity ?? 1;
    const sessionId: string | null = userId ? null : (body?.sessionId ?? null);

    if (!userId && !sessionId) {
      return NextResponse.json(
        { error: "Se requiere userId (auth) o sessionId (guest)" },
        { status: 400 }
      );
    }

    // 2) Validación de inputs
    const productId = Number(rawProductId);
    const qty = Number(rawQty);

    if (!Number.isFinite(productId) || productId <= 0) {
      return NextResponse.json(
        { error: "productId inválido (número > 0 requerido)" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(qty) || qty < 1 || qty > 10) {
      return NextResponse.json(
        { error: "La cantidad debe estar entre 1 y 10" },
        { status: 400 }
      );
    }

    // 3) Producto + stock
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }
    if ((product.stock ?? 0) < qty) {
      return NextResponse.json({ error: "Stock insuficiente" }, { status: 400 });
    }

    // 4) ¿Existe ya en carrito?
    const whereExisting = userId
      ? and(eq(cartItems.userId, userId), eq(cartItems.productId, productId))
      : and(eq(cartItems.sessionId, sessionId!), eq(cartItems.productId, productId));

    const existing = await db.select().from(cartItems).where(whereExisting).limit(1);

    if (existing.length) {
      const newQuantity = existing[0].quantity + qty;

      if (newQuantity > 10) {
        return NextResponse.json(
          { error: "No puedes agregar más de 10 unidades de este producto" },
          { status: 400 }
        );
      }
      if ((product.stock ?? 0) < newQuantity) {
        return NextResponse.json({ error: "Stock insuficiente" }, { status: 400 });
      }

      await db
        .update(cartItems)
        .set({ quantity: newQuantity, updatedAt: new Date().toISOString() })
        .where(whereExisting);
    } else {
      await db.insert(cartItems).values({
        userId,
        sessionId,
        productId,
        quantity: qty,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // 5) Devolver SIEMPRE el carrito actualizado (formato estable)
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
        items,
        subtotal: Number(subtotal.toFixed(2)),
        itemCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/cart/add error:", error);
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
