import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { coupons } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single coupon by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const coupon = await db
        .select()
        .from(coupons)
        .where(eq(coupons.id, parseInt(id)))
        .limit(1);

      if (coupon.length === 0) {
        return NextResponse.json(
          { error: 'Coupon not found', code: 'COUPON_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(coupon[0], { status: 200 });
    }

    // List all coupons with filters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const activeFilter = searchParams.get('active');

    let query = db.select().from(coupons);

    // Apply active filter if provided
    if (activeFilter !== null) {
      const isActive = activeFilter === 'true' || activeFilter === '1';
      query = query.where(eq(coupons.active, isActive));
    }

    const results = await query
      .orderBy(desc(coupons.createdAt))
      .limit(limit)
      .offset(offset);

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
    const { code, type, value, minPurchase, startDate, endDate, active, oneTimePerUser, maxUses } = body;

    // Validate required fields
    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Code is required and must be a string', code: 'MISSING_CODE' },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json(
        { error: 'Type is required', code: 'MISSING_TYPE' },
        { status: 400 }
      );
    }

    if (value === undefined || value === null) {
      return NextResponse.json(
        { error: 'Value is required', code: 'MISSING_VALUE' },
        { status: 400 }
      );
    }

    if (!startDate) {
      return NextResponse.json(
        { error: 'Start date is required', code: 'MISSING_START_DATE' },
        { status: 400 }
      );
    }

    // Convert code to uppercase and validate format
    const upperCode = code.trim().toUpperCase();
    const codeRegex = /^[A-Z0-9]{3,20}$/;
    
    if (!codeRegex.test(upperCode)) {
      return NextResponse.json(
        { 
          error: 'Code must be alphanumeric, uppercase, and between 3-20 characters', 
          code: 'INVALID_CODE_FORMAT' 
        },
        { status: 400 }
      );
    }

    // Validate type
    if (type !== 'percentage' && type !== 'fixed') {
      return NextResponse.json(
        { error: 'Type must be "percentage" or "fixed"', code: 'INVALID_TYPE' },
        { status: 400 }
      );
    }

    // Validate value
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      return NextResponse.json(
        { error: 'Value must be greater than 0', code: 'INVALID_VALUE' },
        { status: 400 }
      );
    }

    if (type === 'percentage' && numValue > 100) {
      return NextResponse.json(
        { error: 'Percentage value must be <= 100', code: 'INVALID_PERCENTAGE' },
        { status: 400 }
      );
    }

    // Validate startDate
    const startDateObj = new Date(startDate);
    if (isNaN(startDateObj.getTime())) {
      return NextResponse.json(
        { error: 'Start date must be a valid ISO date string', code: 'INVALID_START_DATE' },
        { status: 400 }
      );
    }

    // Validate endDate if provided
    if (endDate) {
      const endDateObj = new Date(endDate);
      if (isNaN(endDateObj.getTime())) {
        return NextResponse.json(
          { error: 'End date must be a valid ISO date string', code: 'INVALID_END_DATE' },
          { status: 400 }
        );
      }

      if (endDateObj <= startDateObj) {
        return NextResponse.json(
          { error: 'End date must be after start date', code: 'INVALID_DATE_RANGE' },
          { status: 400 }
        );
      }
    }

    // Validate maxUses if provided
    if (maxUses !== undefined && maxUses !== null) {
      const numMaxUses = parseInt(maxUses);
      if (isNaN(numMaxUses) || numMaxUses <= 0) {
        return NextResponse.json(
          { error: 'Max uses must be greater than 0', code: 'INVALID_MAX_USES' },
          { status: 400 }
        );
      }
    }

    // Validate minPurchase if provided
    if (minPurchase !== undefined && minPurchase !== null) {
      const numMinPurchase = parseFloat(minPurchase);
      if (isNaN(numMinPurchase) || numMinPurchase <= 0) {
        return NextResponse.json(
          { error: 'Minimum purchase must be greater than 0', code: 'INVALID_MIN_PURCHASE' },
          { status: 400 }
        );
      }
    }

    // Check for duplicate code
    const existingCoupon = await db
      .select()
      .from(coupons)
      .where(eq(coupons.code, upperCode))
      .limit(1);

    if (existingCoupon.length > 0) {
      return NextResponse.json(
        { error: 'Coupon code already exists', code: 'DUPLICATE_CODE' },
        { status: 409 }
      );
    }

    // Prepare insert data
    const now = new Date().toISOString();
    const insertData: any = {
      code: upperCode,
      type,
      value: numValue,
      startDate,
      currentUses: 0,
      createdAt: now,
      updatedAt: now,
    };

    // Add optional fields
    if (minPurchase !== undefined && minPurchase !== null) {
      insertData.minPurchase = parseFloat(minPurchase);
    }
    
    if (endDate) {
      insertData.endDate = endDate;
    }
    
    if (active !== undefined) {
      insertData.active = Boolean(active);
    } else {
      insertData.active = true;
    }
    
    if (oneTimePerUser !== undefined) {
      insertData.oneTimePerUser = Boolean(oneTimePerUser);
    } else {
      insertData.oneTimePerUser = false;
    }
    
    if (maxUses !== undefined && maxUses !== null) {
      insertData.maxUses = parseInt(maxUses);
    }

    const newCoupon = await db.insert(coupons).values(insertData).returning();

    return NextResponse.json(newCoupon[0], { status: 201 });
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

    // Check if attempting to update immutable fields
    if ('code' in body) {
      return NextResponse.json(
        { error: 'Coupon code cannot be updated', code: 'CODE_IMMUTABLE' },
        { status: 400 }
      );
    }

    if ('currentUses' in body) {
      return NextResponse.json(
        { error: 'Current uses cannot be manually updated', code: 'CURRENT_USES_IMMUTABLE' },
        { status: 400 }
      );
    }

    // Check if coupon exists
    const existingCoupon = await db
      .select()
      .from(coupons)
      .where(eq(coupons.id, parseInt(id)))
      .limit(1);

    if (existingCoupon.length === 0) {
      return NextResponse.json(
        { error: 'Coupon not found', code: 'COUPON_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    // Validate and add type if provided
    if ('type' in body) {
      if (body.type !== 'percentage' && body.type !== 'fixed') {
        return NextResponse.json(
          { error: 'Type must be "percentage" or "fixed"', code: 'INVALID_TYPE' },
          { status: 400 }
        );
      }
      updateData.type = body.type;
    }

    // Validate and add value if provided
    if ('value' in body) {
      const numValue = parseFloat(body.value);
      if (isNaN(numValue) || numValue <= 0) {
        return NextResponse.json(
          { error: 'Value must be greater than 0', code: 'INVALID_VALUE' },
          { status: 400 }
        );
      }

      const typeToCheck = updateData.type || existingCoupon[0].type;
      if (typeToCheck === 'percentage' && numValue > 100) {
        return NextResponse.json(
          { error: 'Percentage value must be <= 100', code: 'INVALID_PERCENTAGE' },
          { status: 400 }
        );
      }

      updateData.value = numValue;
    }

    // Validate and add minPurchase if provided
    if ('minPurchase' in body) {
      if (body.minPurchase !== null && body.minPurchase !== undefined) {
        const numMinPurchase = parseFloat(body.minPurchase);
        if (isNaN(numMinPurchase) || numMinPurchase <= 0) {
          return NextResponse.json(
            { error: 'Minimum purchase must be greater than 0', code: 'INVALID_MIN_PURCHASE' },
            { status: 400 }
          );
        }
        updateData.minPurchase = numMinPurchase;
      } else {
        updateData.minPurchase = null;
      }
    }

    // Validate and add startDate if provided
    if ('startDate' in body) {
      const startDateObj = new Date(body.startDate);
      if (isNaN(startDateObj.getTime())) {
        return NextResponse.json(
          { error: 'Start date must be a valid ISO date string', code: 'INVALID_START_DATE' },
          { status: 400 }
        );
      }
      updateData.startDate = body.startDate;
    }

    // Validate and add endDate if provided
    if ('endDate' in body) {
      if (body.endDate !== null && body.endDate !== undefined) {
        const endDateObj = new Date(body.endDate);
        if (isNaN(endDateObj.getTime())) {
          return NextResponse.json(
            { error: 'End date must be a valid ISO date string', code: 'INVALID_END_DATE' },
            { status: 400 }
          );
        }

        const startDateToCheck = updateData.startDate || existingCoupon[0].startDate;
        const startDateObj = new Date(startDateToCheck);

        if (endDateObj <= startDateObj) {
          return NextResponse.json(
            { error: 'End date must be after start date', code: 'INVALID_DATE_RANGE' },
            { status: 400 }
          );
        }

        updateData.endDate = body.endDate;
      } else {
        updateData.endDate = null;
      }
    }

    // Validate and add maxUses if provided
    if ('maxUses' in body) {
      if (body.maxUses !== null && body.maxUses !== undefined) {
        const numMaxUses = parseInt(body.maxUses);
        if (isNaN(numMaxUses) || numMaxUses <= 0) {
          return NextResponse.json(
            { error: 'Max uses must be greater than 0', code: 'INVALID_MAX_USES' },
            { status: 400 }
          );
        }
        updateData.maxUses = numMaxUses;
      } else {
        updateData.maxUses = null;
      }
    }

    // Add boolean fields if provided
    if ('active' in body) {
      updateData.active = Boolean(body.active);
    }

    if ('oneTimePerUser' in body) {
      updateData.oneTimePerUser = Boolean(body.oneTimePerUser);
    }

    const updated = await db
      .update(coupons)
      .set(updateData)
      .where(eq(coupons.id, parseInt(id)))
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

    // Check if coupon exists
    const existingCoupon = await db
      .select()
      .from(coupons)
      .where(eq(coupons.id, parseInt(id)))
      .limit(1);

    if (existingCoupon.length === 0) {
      return NextResponse.json(
        { error: 'Coupon not found', code: 'COUPON_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Check if coupon has been used
    if (existingCoupon[0].currentUses > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete coupon that has been redeemed', 
          code: 'COUPON_HAS_REDEMPTIONS' 
        },
        { status: 400 }
      );
    }

    const deleted = await db
      .delete(coupons)
      .where(eq(coupons.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Coupon deleted successfully',
        coupon: deleted[0],
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