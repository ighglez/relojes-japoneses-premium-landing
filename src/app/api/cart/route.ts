import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { cartItems, products } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/** Fuerza ejecución en Node y evita caché/SSG */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/** GET: obtiene carrito por userId o sessionId */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');

    if (!userId && !sessionId) {
      return NextResponse.json(
        { items: [], cartTotal: 0, itemCount: 0, count: 0 },
        { status: 200 }
      );
    }

    const whereCondition = userId
      ? eq(cartItems.userId, userId)
      : eq(cartItems.sessionId, sessionId!);

    const items = await db
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
      .where(whereCondition);

    const cartTotal = items.reduce((sum, item) => {
      return sum + ((item.productPrice || 0) * item.quantity);
    }, 0);

    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    const formattedItems = items.map((item) => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      product: {
        name: item.productName,
        brand: item.productBrand,
        reference: item.productReference,
        price: item.productPrice,
        stock: item.productStock,
        imageUrl: item.productImageUrl,
      },
    }));

    return NextResponse.json(
      {
        items: formattedItems,
        cartTotal: Math.round(cartTotal * 100) / 100,
        itemCount,
        count: itemCount, // compat extra
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET cart error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

/** POST: añade al carrito (user o guest con sessionId) */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, quantity = 1, userId, sessionId } = body;

    if (!userId && !sessionId) {
      return NextResponse.json(
        { error: 'Either userId or sessionId is required', code: 'MISSING_IDENTIFIER' },
        { status: 400 }
      );
    }

    // Coerción segura de productId a número
    const pid: number =
      typeof productId === 'string' ? parseInt(productId, 10) : productId;

    if (!pid || Number.isNaN(pid)) {
      return NextResponse.json(
        { error: 'Invalid product ID', code: 'INVALID_PRODUCT_ID' },
        { status: 400 }
      );
    }

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
      return NextResponse.json(
        { error: 'Quantity must be between 1 and 10', code: 'INVALID_QUANTITY' },
        { status: 400 }
      );
    }

    // Producto existe y hay stock
    const product = await db
      .select()
      .from(products)
      .where(eq(products.id, pid))
      .limit(1);

    if (product.length === 0) {
      return NextResponse.json(
        { error: 'Product not found', code: 'PRODUCT_NOT_FOUND' },
        { status: 404 }
      );
    }

    if ((product[0].stock ?? 0) < quantity) {
      return NextResponse.json(
        { error: 'Insufficient stock available', code: 'INSUFFICIENT_STOCK' },
        { status: 400 }
      );
    }

    // ¿Ya existe en carrito?
    const whereCondition = userId
      ? and(eq(cartItems.userId, userId), eq(cartItems.productId, pid))
      : and(eq(cartItems.sessionId, sessionId!), eq(cartItems.productId, pid));

    const existingItem = await db.select().from(cartItems).where(whereCondition).limit(1);

    if (existingItem.length > 0) {
      const newQuantity = existingItem[0].quantity + quantity;

      if (newQuantity > 10) {
        return NextResponse.json(
          { error: 'Cannot add more items. Maximum quantity per product is 10', code: 'QUANTITY_LIMIT_EXCEEDED' },
          { status: 400 }
        );
      }

      if ((product[0].stock ?? 0) < newQuantity) {
        return NextResponse.json(
          { error: 'Insufficient stock available', code: 'INSUFFICIENT_STOCK' },
          { status: 400 }
        );
      }

      const updated = await db
        .update(cartItems)
        .set({
          quantity: newQuantity,
          updatedAt: new Date().toISOString(),
        })
        .where(whereCondition)
        .returning();

      return NextResponse.json(updated[0], { status: 201 });
    }

    // Insertar nuevo ítem
    const newItem = await db
      .insert(cartItems)
      .values({
        userId: userId || null,
        sessionId: sessionId || null,
        productId: pid,
        quantity,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newItem[0], { status: 201 });
  } catch (error) {
    console.error('POST cart error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

/** PUT: actualizar cantidad de un item por id */
export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || Number.isNaN(parseInt(id, 10))) {
      return NextResponse.json(
        { error: 'Valid cart item ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { quantity } = body;

    if (!Number.isInteger(quantity)) {
      return NextResponse.json(
        { error: 'Quantity is required', code: 'MISSING_QUANTITY' },
        { status: 400 }
      );
    }

    if (quantity < 1 || quantity > 10) {
      return NextResponse.json(
        { error: 'Quantity must be between 1 and 10', code: 'INVALID_QUANTITY' },
        { status: 400 }
      );
    }

    const item = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.id, parseInt(id, 10)))
      .limit(1);

    if (item.length === 0) {
      return NextResponse.json(
        { error: 'Cart item not found', code: 'CART_ITEM_NOT_FOUND' },
        { status: 404 }
      );
    }

    const product = await db
      .select()
      .from(products)
      .where(eq(products.id, item[0].productId!))
      .limit(1);

    if (product.length === 0) {
      return NextResponse.json(
        { error: 'Product not found', code: 'PRODUCT_NOT_FOUND' },
        { status: 404 }
      );
    }

    if ((product[0].stock ?? 0) < quantity) {
      return NextResponse.json(
        { error: 'Insufficient stock available', code: 'INSUFFICIENT_STOCK' },
        { status: 400 }
      );
    }

    const updated = await db
      .update(cartItems)
      .set({
        quantity,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(cartItems.id, parseInt(id, 10)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT cart error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

/** DELETE: elimina un ítem por id o vacía carrito por userId/sessionId */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');

    if (id) {
      if (Number.isNaN(parseInt(id, 10))) {
        return NextResponse.json(
          { error: 'Valid cart item ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const item = await db
        .select()
        .from(cartItems)
        .where(eq(cartItems.id, parseInt(id, 10)))
        .limit(1);

      if (item.length === 0) {
        return NextResponse.json(
          { error: 'Cart item not found', code: 'CART_ITEM_NOT_FOUND' },
          { status: 404 }
        );
      }

      await db.delete(cartItems).where(eq(cartItems.id, parseInt(id, 10))).returning();

      return NextResponse.json({ message: 'Item removed from cart' }, { status: 200 });
    }

    if (!userId && !sessionId) {
      return NextResponse.json(
        { error: 'Either userId or sessionId is required to clear cart', code: 'MISSING_IDENTIFIER' },
        { status: 400 }
      );
    }

    const whereCondition = userId
      ? eq(cartItems.userId, userId)
      : eq(cartItems.sessionId, sessionId!);

    const deleted = await db.delete(cartItems).where(whereCondition).returning();

    return NextResponse.json(
      { message: 'Cart cleared', deletedCount: deleted.length },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE cart error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
