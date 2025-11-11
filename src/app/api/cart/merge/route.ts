import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { cartItems, products } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // 1) Autenticación
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Autenticación requerida' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 2) Parsea body
    const body = await request.json().catch(() => ({}));
    const guestSessionId = body?.guestSessionId as string | undefined;

    if (!guestSessionId) {
      return NextResponse.json(
        { error: 'guestSessionId es requerido' },
        { status: 400 }
      );
    }

    // 3) Trae ítems del carrito guest
    const guestCart = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.sessionId, guestSessionId));

    if (guestCart.length === 0) {
      // Nada que fusionar: devuelve el carrito actual del usuario
      const userItems = await db
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
        .where(eq(cartItems.userId, userId));

      const cartTotal = userItems.reduce(
        (sum, it) => sum + (it.productPrice ?? 0) * it.quantity,
        0
      );
      const itemCount = userItems.reduce((sum, it) => sum + it.quantity, 0);

      return NextResponse.json(
        {
          items: userItems.map((it) => ({
            id: it.id,
            productId: it.productId,
            quantity: it.quantity,
            product: {
              name: it.productName,
              brand: it.productBrand,
              reference: it.productReference,
              price: it.productPrice,
              stock: it.productStock,
              imageUrl: it.productImageUrl,
            },
          })),
          cartTotal: Math.round(cartTotal * 100) / 100,
          itemCount,
        },
        { status: 200 }
      );
    }

    // 4) Fusiona en transacción
    await db.transaction(async (tx) => {
      for (const guestItem of guestCart) {
        if (!guestItem.productId) {
          // Si por algún motivo el item no tiene productId, lo limpiamos
          await tx.delete(cartItems).where(eq(cartItems.id, guestItem.id));
          continue;
        }

        // Lee el stock real del producto
        const [prod] = await tx
          .select({
            id: products.id,
            stock: products.stock,
          })
          .from(products)
          .where(eq(products.id, guestItem.productId))
          .limit(1);

        // Si el producto ya no existe, elimina el ítem guest
        if (!prod) {
          await tx.delete(cartItems).where(eq(cartItems.id, guestItem.id));
          continue;
        }

        // Busca si ya existe en el carrito del usuario
        const [existing] = await tx
          .select()
          .from(cartItems)
          .where(
            and(eq(cartItems.userId, userId), eq(cartItems.productId, guestItem.productId))
          )
          .limit(1);

        if (existing) {
          // Calcula nueva cantidad respetando límites
          const sumQty = existing.quantity + guestItem.quantity;
          const cappedByLimit = Math.min(sumQty, 10);
          const newQuantity = Math.min(cappedByLimit, prod.stock ?? 0);

          if (newQuantity <= 0) {
            // Si no hay stock, deja la cantidad como estaba y simplemente elimina el guest
            await tx.delete(cartItems).where(eq(cartItems.id, guestItem.id));
            continue;
          }

          // Actualiza cantidad del ítem del usuario
          await tx
            .update(cartItems)
            .set({
              quantity: newQuantity,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(cartItems.id, existing.id));

          // Elimina el ítem guest
          await tx.delete(cartItems).where(eq(cartItems.id, guestItem.id));
        } else {
          // Transferencia directa al usuario, respetando stock/límite
          const transferQty = Math.min(guestItem.quantity, 10, prod.stock ?? 0);

          if (transferQty <= 0) {
            // Sin stock: elimina el guest
            await tx.delete(cartItems).where(eq(cartItems.id, guestItem.id));
            continue;
          }

          await tx
            .update(cartItems)
            .set({
              userId,
              sessionId: null,
              quantity: transferQty,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(cartItems.id, guestItem.id));
        }
      }

      // Limpieza de seguridad: por si quedó algo del guest
      await tx.delete(cartItems).where(eq(cartItems.sessionId, guestSessionId));
    });

    // 5) Devuelve carrito final del usuario con formato unificado
    const finalItems = await db
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
      .where(eq(cartItems.userId, userId));

    const cartTotal = finalItems.reduce(
      (sum, it) => sum + (it.productPrice ?? 0) * it.quantity,
      0
    );
    const itemCount = finalItems.reduce((sum, it) => sum + it.quantity, 0);

    return NextResponse.json(
      {
        items: finalItems.map((it) => ({
          id: it.id,
          productId: it.productId,
          quantity: it.quantity,
          product: {
            name: it.productName,
            brand: it.productBrand,
            reference: it.productReference,
            price: it.productPrice,
            stock: it.productStock,
            imageUrl: it.productImageUrl,
          },
        })),
        cartTotal: Math.round(cartTotal * 100) / 100,
        itemCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('POST /api/cart/merge error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
