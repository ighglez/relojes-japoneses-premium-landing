import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { products } from '@/db/schema';
import { eq, like, and, or, gte, lte, gt } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single product by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const product = await db
        .select()
        .from(products)
        .where(eq(products.id, parseInt(id)))
        .limit(1);

      if (product.length === 0) {
        return NextResponse.json(
          { error: 'Product not found', code: 'PRODUCT_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(product[0], { status: 200 });
    }

    // List products with filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const brand = searchParams.get('brand');
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const inStock = searchParams.get('inStock');

    const conditions = [];

    // Search across multiple fields
    if (search) {
      conditions.push(
        or(
          like(products.name, `%${search}%`),
          like(products.brand, `%${search}%`),
          like(products.reference, `%${search}%`),
          like(products.description, `%${search}%`)
        )
      );
    }

    // Brand filter (case-insensitive partial match)
    if (brand) {
      conditions.push(like(products.brand, `%${brand}%`));
    }

    // Category filter (exact match)
    if (category) {
      conditions.push(eq(products.category, category));
    }

    // Featured products filter
    if (featured === 'true') {
      conditions.push(eq(products.isFeatured, true));
    }

    // Price range filters
    if (minPrice) {
      const minPriceNum = parseFloat(minPrice);
      if (!isNaN(minPriceNum) && minPriceNum >= 0) {
        conditions.push(gte(products.price, minPriceNum));
      }
    }

    if (maxPrice) {
      const maxPriceNum = parseFloat(maxPrice);
      if (!isNaN(maxPriceNum) && maxPriceNum >= 0) {
        conditions.push(lte(products.price, maxPriceNum));
      }
    }

    // In stock filter
    if (inStock === 'true') {
      conditions.push(gt(products.stock, 0));
    }

    let query = db.select().from(products);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, brand, reference, description, imageUrl, price, stock, category, features, isFeatured } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 200) {
      return NextResponse.json(
        { error: 'Name is required and must be between 2 and 200 characters', code: 'INVALID_NAME' },
        { status: 400 }
      );
    }

    if (!brand || typeof brand !== 'string' || brand.trim().length < 2 || brand.trim().length > 100) {
      return NextResponse.json(
        { error: 'Brand is required and must be between 2 and 100 characters', code: 'INVALID_BRAND' },
        { status: 400 }
      );
    }

    if (!reference || typeof reference !== 'string' || reference.trim().length < 2 || reference.trim().length > 50) {
      return NextResponse.json(
        { error: 'Reference is required and must be between 2 and 50 characters', code: 'INVALID_REFERENCE' },
        { status: 400 }
      );
    }

    if (price === undefined || price === null || typeof price !== 'number' || price <= 0) {
      return NextResponse.json(
        { error: 'Price is required and must be greater than 0', code: 'INVALID_PRICE' },
        { status: 400 }
      );
    }

    if (stock === undefined || stock === null || typeof stock !== 'number' || stock < 0) {
      return NextResponse.json(
        { error: 'Stock is required and must be greater than or equal to 0', code: 'INVALID_STOCK' },
        { status: 400 }
      );
    }

    if (!category || typeof category !== 'string' || category.trim().length === 0) {
      return NextResponse.json(
        { error: 'Category is required and cannot be empty', code: 'INVALID_CATEGORY' },
        { status: 400 }
      );
    }

    // Validate features if provided
    if (features !== undefined && features !== null) {
      if (!Array.isArray(features)) {
        return NextResponse.json(
          { error: 'Features must be a valid JSON array', code: 'INVALID_FEATURES' },
          { status: 400 }
        );
      }
    }

    const timestamp = new Date().toISOString();

    // Extract additional fields from body
    const {
      slug,
      series,
      movement,
      diameter,
      color,
      waterResistance,
      currency,
      isNew,
      isExclusive,
      images
    } = body;

    const newProduct = await db
      .insert(products)
      .values({
        slug: slug ? slug.trim() : null,
        name: name.trim(),
        brand: brand.trim(),
        series: series ? series.trim() : null,
        reference: reference.trim(),
        description: description ? description.trim() : null,
        movement: movement ? movement.trim() : null,
        diameter: diameter ? diameter.trim() : null,
        color: color ? color.trim() : null,
        waterResistance: waterResistance ? waterResistance.trim() : null,
        imageUrl: imageUrl ? imageUrl.trim() : null,
        price,
        currency: currency || 'EUR',
        stock,
        category: category.trim(),
        features: features || null,
        isNew: isNew === true,
        isExclusive: isExclusive === true,
        isFeatured: isFeatured === true,
        images: images || null,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .returning();

    return NextResponse.json(newProduct[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, brand, reference, description, imageUrl, price, stock, category, features, isFeatured } = body;

    // Check if product exists
    const existingProduct = await db
      .select()
      .from(products)
      .where(eq(products.id, parseInt(id)))
      .limit(1);

    if (existingProduct.length === 0) {
      return NextResponse.json(
        { error: 'Product not found', code: 'PRODUCT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Validate fields if provided
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 200) {
        return NextResponse.json(
          { error: 'Name must be between 2 and 200 characters', code: 'INVALID_NAME' },
          { status: 400 }
        );
      }
    }

    if (brand !== undefined) {
      if (typeof brand !== 'string' || brand.trim().length < 2 || brand.trim().length > 100) {
        return NextResponse.json(
          { error: 'Brand must be between 2 and 100 characters', code: 'INVALID_BRAND' },
          { status: 400 }
        );
      }
    }

    if (reference !== undefined) {
      if (typeof reference !== 'string' || reference.trim().length < 2 || reference.trim().length > 50) {
        return NextResponse.json(
          { error: 'Reference must be between 2 and 50 characters', code: 'INVALID_REFERENCE' },
          { status: 400 }
        );
      }
    }

    if (price !== undefined) {
      if (typeof price !== 'number' || price <= 0) {
        return NextResponse.json(
          { error: 'Price must be greater than 0', code: 'INVALID_PRICE' },
          { status: 400 }
        );
      }
    }

    if (stock !== undefined) {
      if (typeof stock !== 'number' || stock < 0) {
        return NextResponse.json(
          { error: 'Stock must be greater than or equal to 0', code: 'INVALID_STOCK' },
          { status: 400 }
        );
      }
    }

    if (category !== undefined) {
      if (typeof category !== 'string' || category.trim().length === 0) {
        return NextResponse.json(
          { error: 'Category cannot be empty', code: 'INVALID_CATEGORY' },
          { status: 400 }
        );
      }
    }

    if (features !== undefined && features !== null) {
      if (!Array.isArray(features)) {
        return NextResponse.json(
          { error: 'Features must be a valid JSON array', code: 'INVALID_FEATURES' },
          { status: 400 }
        );
      }
    }

    const updates: any = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) updates.name = name.trim();
    if (brand !== undefined) updates.brand = brand.trim();
    if (reference !== undefined) updates.reference = reference.trim();
    if (description !== undefined) updates.description = description ? description.trim() : null;
    if (imageUrl !== undefined) updates.imageUrl = imageUrl ? imageUrl.trim() : null;
    if (price !== undefined) updates.price = price;
    if (stock !== undefined) updates.stock = stock;
    if (category !== undefined) updates.category = category.trim();
    if (features !== undefined) updates.features = features;
    if (isFeatured !== undefined) updates.isFeatured = isFeatured === true;

    const updated = await db
      .update(products)
      .set(updates)
      .where(eq(products.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if product exists
    const existingProduct = await db
      .select()
      .from(products)
      .where(eq(products.id, parseInt(id)))
      .limit(1);

    if (existingProduct.length === 0) {
      return NextResponse.json(
        { error: 'Product not found', code: 'PRODUCT_NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(products)
      .where(eq(products.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Product deleted successfully',
        product: deleted[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}