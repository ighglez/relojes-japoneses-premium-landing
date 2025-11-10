import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { coupons, couponRedemptions } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Optional authentication
    let userId: string | null = null;
    try {
      const session = await auth.api.getSession({
        headers: await headers()
      });
      if (session?.user?.id) {
        userId = session.user.id;
      }
    } catch (error) {
      // Not authenticated, continue as guest
    }

    // Parse request body
    const body = await request.json();
    const { code, subtotal, email } = body;

    // Validate required fields
    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'El código del cupón es requerido' },
        { status: 400 }
      );
    }

    if (!subtotal || typeof subtotal !== 'number' || subtotal <= 0) {
      return NextResponse.json(
        { error: 'El subtotal del carrito es requerido y debe ser mayor a 0' },
        { status: 400 }
      );
    }

    // Normalize code to uppercase
    const normalizedCode = code.trim().toUpperCase();

    // Find coupon by code
    const couponResult = await db.select()
      .from(coupons)
      .where(eq(coupons.code, normalizedCode))
      .limit(1);

    if (couponResult.length === 0) {
      return NextResponse.json({
        valid: false,
        message: 'Código de cupón no válido'
      }, { status: 200 });
    }

    const coupon = couponResult[0];

    // Check if coupon is active
    if (!coupon.active) {
      return NextResponse.json({
        valid: false,
        message: 'Este cupón no está activo'
      }, { status: 200 });
    }

    // Check start and end dates
    const now = new Date().toISOString();
    
    if (coupon.startDate > now) {
      return NextResponse.json({
        valid: false,
        message: 'Este cupón aún no está disponible'
      }, { status: 200 });
    }

    if (coupon.endDate && coupon.endDate < now) {
      return NextResponse.json({
        valid: false,
        message: 'Este cupón ha expirado'
      }, { status: 200 });
    }

    // Check minimum purchase requirement
    if (coupon.minPurchase && subtotal < coupon.minPurchase) {
      return NextResponse.json({
        valid: false,
        message: `Compra mínima de €${coupon.minPurchase.toFixed(2)} requerida`
      }, { status: 200 });
    }

    // Check max uses
    if (coupon.maxUses !== null && coupon.currentUses >= coupon.maxUses) {
      return NextResponse.json({
        valid: false,
        message: 'Este cupón ha alcanzado su límite de usos'
      }, { status: 200 });
    }

    // Check one-time-per-user restriction
    if (coupon.oneTimePerUser && (userId || email)) {
      const conditions = [eq(couponRedemptions.couponId, coupon.id)];
      
      if (userId && email) {
        conditions.push(
          and(
            eq(couponRedemptions.userId, userId),
            eq(couponRedemptions.email, email.toLowerCase())
          ) as any
        );
      } else if (userId) {
        conditions.push(eq(couponRedemptions.userId, userId));
      } else if (email) {
        conditions.push(eq(couponRedemptions.email, email.toLowerCase()));
      }

      const redemptionCheck = await db.select()
        .from(couponRedemptions)
        .where(and(...conditions))
        .limit(1);

      if (redemptionCheck.length > 0) {
        return NextResponse.json({
          valid: false,
          message: 'Ya has utilizado este cupón'
        }, { status: 200 });
      }
    }

    // Calculate discount
    let discountAmount = 0;
    
    if (coupon.type === 'percentage') {
      discountAmount = subtotal * (coupon.value / 100);
    } else if (coupon.type === 'fixed') {
      discountAmount = Math.min(coupon.value, subtotal);
    }

    // Round to 2 decimals
    discountAmount = Math.round(discountAmount * 100) / 100;

    // Determine free shipping
    const freeShipping = normalizedCode === 'WELCOME5';

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discountAmount
      },
      discountAmount,
      freeShipping,
      message: 'Cupón aplicado correctamente'
    }, { status: 200 });

  } catch (error) {
    console.error('POST /api/coupons/validate error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor: ' + (error as Error).message },
      { status: 500 }
    );
  }
}