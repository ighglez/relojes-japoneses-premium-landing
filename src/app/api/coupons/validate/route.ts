import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { coupons, couponRedemptions } from '@/db/schema';
import { eq, and, or, lt, lte, gte } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, cartTotal, userId, email } = body;

    // Validate required fields
    if (!code || typeof code !== 'string') {
      return NextResponse.json({
        error: 'Coupon code is required',
        code: 'MISSING_COUPON_CODE'
      }, { status: 400 });
    }

    if (!cartTotal || typeof cartTotal !== 'number' || cartTotal <= 0) {
      return NextResponse.json({
        error: 'Valid cart total is required',
        code: 'INVALID_CART_TOTAL'
      }, { status: 400 });
    }

    // Convert code to uppercase for consistency
    const normalizedCode = code.trim().toUpperCase();

    // Find coupon by code (case-insensitive)
    const couponResult = await db.select()
      .from(coupons)
      .where(eq(coupons.code, normalizedCode))
      .limit(1);

    if (couponResult.length === 0) {
      return NextResponse.json({
        valid: false,
        error: 'Coupon code not found',
        code: 'COUPON_NOT_FOUND'
      }, { status: 400 });
    }

    const coupon = couponResult[0];

    // Check if coupon is active
    if (!coupon.active) {
      return NextResponse.json({
        valid: false,
        error: 'This coupon is no longer active',
        code: 'COUPON_INACTIVE'
      }, { status: 400 });
    }

    // Check if coupon has started
    const now = new Date().toISOString();
    if (coupon.startDate > now) {
      return NextResponse.json({
        valid: false,
        error: 'This coupon is not yet available',
        code: 'COUPON_NOT_STARTED'
      }, { status: 400 });
    }

    // Check if coupon has expired
    if (coupon.endDate && coupon.endDate < now) {
      return NextResponse.json({
        valid: false,
        error: 'This coupon has expired',
        code: 'COUPON_EXPIRED'
      }, { status: 400 });
    }

    // Check minimum purchase requirement
    if (coupon.minPurchase !== null && cartTotal < coupon.minPurchase) {
      return NextResponse.json({
        valid: false,
        error: `Minimum purchase of ${coupon.minPurchase.toFixed(2)} required to use this coupon`,
        code: 'MIN_PURCHASE_NOT_MET'
      }, { status: 400 });
    }

    // Check maximum uses limit
    if (coupon.maxUses !== null && coupon.currentUses >= coupon.maxUses) {
      return NextResponse.json({
        valid: false,
        error: 'This coupon has reached its maximum number of uses',
        code: 'MAX_USES_EXCEEDED'
      }, { status: 400 });
    }

    // Check one-time-per-user restriction
    if (coupon.oneTimePerUser) {
      if (userId || email) {
        const conditions = [];
        
        if (userId) {
          conditions.push(eq(couponRedemptions.userId, userId));
        }
        
        if (email) {
          conditions.push(eq(couponRedemptions.email, email.toLowerCase()));
        }

        const redemptionCheck = await db.select()
          .from(couponRedemptions)
          .where(
            and(
              eq(couponRedemptions.couponId, coupon.id),
              or(...conditions)
            )
          )
          .limit(1);

        if (redemptionCheck.length > 0) {
          return NextResponse.json({
            valid: false,
            error: 'You have already used this coupon',
            code: 'ALREADY_USED'
          }, { status: 400 });
        }
      }
    }

    // Calculate discount amount based on coupon type
    let discountAmount = 0;
    
    if (coupon.type === 'percentage') {
      discountAmount = cartTotal * (coupon.value / 100);
    } else if (coupon.type === 'fixed') {
      discountAmount = Math.min(coupon.value, cartTotal);
    }

    // Round to 2 decimal places
    discountAmount = Math.round(discountAmount * 100) / 100;

    // Return successful validation
    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discountAmount
      },
      message: 'Coupon applied successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}