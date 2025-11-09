import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { products } from '@/db/schema';
import { eq, or } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED' 
      }, { status: 401 });
    }

    const body = await request.json();

    // Security check: reject if userId provided in body
    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    const {
      slug,
      name,
      brand,
      series,
      reference,
      description,
      movement,
      diameter,
      color,
      waterResistance,
      price,
      currency = 'EUR',
      stock,
      category,
      isNew = false,
      isExclusive = false,
      isFeatured = false,
      images,
      features
    } = body;

    // Validate required fields
    if (!slug) {
      return NextResponse.json({ 
        error: "Slug is required",
        code: "MISSING_SLUG" 
      }, { status: 400 });
    }

    if (!name) {
      return NextResponse.json({ 
        error: "Name is required",
        code: "MISSING_NAME" 
      }, { status: 400 });
    }

    if (!brand) {
      return NextResponse.json({ 
        error: "Brand is required",
        code: "MISSING_BRAND" 
      }, { status: 400 });
    }

    if (!series) {
      return NextResponse.json({ 
        error: "Series is required",
        code: "MISSING_SERIES" 
      }, { status: 400 });
    }

    if (!reference) {
      return NextResponse.json({ 
        error: "Reference is required",
        code: "MISSING_REFERENCE" 
      }, { status: 400 });
    }

    if (price === undefined || price === null) {
      return NextResponse.json({ 
        error: "Price is required",
        code: "MISSING_PRICE" 
      }, { status: 400 });
    }

    if (stock === undefined || stock === null) {
      return NextResponse.json({ 
        error: "Stock is required",
        code: "MISSING_STOCK" 
      }, { status: 400 });
    }

    if (!category) {
      return NextResponse.json({ 
        error: "Category is required",
        code: "MISSING_CATEGORY" 
      }, { status: 400 });
    }

    // Validate price
    if (typeof price !== 'number' || price <= 0) {
      return NextResponse.json({ 
        error: "Price must be greater than 0",
        code: "INVALID_PRICE" 
      }, { status: 400 });
    }

    // Validate stock
    if (typeof stock !== 'number' || stock < 0) {
      return NextResponse.json({ 
        error: "Stock must be greater than or equal to 0",
        code: "INVALID_STOCK" 
      }, { status: 400 });
    }

    // Sanitize string inputs
    const sanitizedSlug = slug.trim();
    const sanitizedName = name.trim();
    const sanitizedBrand = brand.trim();
    const sanitizedSeries = series.trim();
    const sanitizedReference = reference.trim();
    const sanitizedCategory = category.trim();

    // Check if slug already exists
    const existingSlug = await db.select()
      .from(products)
      .where(eq(products.slug, sanitizedSlug))
      .limit(1);

    if (existingSlug.length > 0) {
      return NextResponse.json({ 
        error: "A product with this slug already exists",
        code: "SLUG_EXISTS" 
      }, { status: 409 });
    }

    // Check if reference already exists
    const existingReference = await db.select()
      .from(products)
      .where(eq(products.reference, sanitizedReference))
      .limit(1);

    if (existingReference.length > 0) {
      return NextResponse.json({ 
        error: "A product with this reference already exists",
        code: "REFERENCE_EXISTS" 
      }, { status: 409 });
    }

    // Prepare insert data
    const now = new Date().toISOString();
    const insertData: any = {
      slug: sanitizedSlug,
      name: sanitizedName,
      brand: sanitizedBrand,
      series: sanitizedSeries,
      reference: sanitizedReference,
      price,
      currency,
      stock,
      category: sanitizedCategory,
      isNew,
      isExclusive,
      isFeatured,
      createdAt: now,
      updatedAt: now
    };

    // Add optional fields if provided
    if (description) {
      insertData.description = description.trim();
    }

    if (movement) {
      insertData.movement = movement.trim();
    }

    if (diameter) {
      insertData.diameter = diameter.trim();
    }

    if (color) {
      insertData.color = color.trim();
    }

    if (waterResistance) {
      insertData.waterResistance = waterResistance.trim();
    }

    if (images) {
      insertData.images = images;
    }

    if (features) {
      insertData.features = features;
    }

    // Insert product
    const newProduct = await db.insert(products)
      .values(insertData)
      .returning();

    return NextResponse.json(newProduct[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}