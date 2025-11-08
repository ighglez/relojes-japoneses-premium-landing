import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { couponRedemptions, coupons, orders, user } from '@/db/schema';
import { eq, and, gte, lte, desc, sql, or, like, isNull } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getCurrentUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const statsEndpoint = request.url.includes('/stats');
    const byCouponEndpoint = request.url.includes('/by-coupon');

    // Stats endpoint
    if (statsEndpoint) {
      try {
        // Total redemptions
        const totalRedemptionsResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(couponRedemptions);
        const totalRedemptions = Number(totalRedemptionsResult[0]?.count || 0);

        // Unique users (non-null userId)
        const uniqueUsersResult = await db
          .select({ count: sql<number>`count(distinct ${couponRedemptions.userId})` })
          .from(couponRedemptions)
          .where(sql`${couponRedemptions.userId} IS NOT NULL`);
        const uniqueUsers = Number(uniqueUsersResult[0]?.count || 0);

        // Unique emails
        const uniqueEmailsResult = await db
          .select({ count: sql<number>`count(distinct ${couponRedemptions.email})` })
          .from(couponRedemptions);
        const uniqueEmails = Number(uniqueEmailsResult[0]?.count || 0);

        // Total discount given
        const totalDiscountResult = await db
          .select({ sum: sql<number>`coalesce(sum(${orders.discountAmount}), 0)` })
          .from(orders)
          .where(sql`${orders.couponCode} IS NOT NULL`);
        const totalDiscountGiven = Number(totalDiscountResult[0]?.sum || 0);

        // Average discount per redemption
        const averageDiscountPerRedemption = totalRedemptions > 0 
          ? totalDiscountGiven / totalRedemptions 
          : 0;

        // Top 5 most-used coupons
        const topCouponsResult = await db
          .select({
            couponId: couponRedemptions.couponId,
            code: coupons.code,
            count: sql<number>`count(*)`,
          })
          .from(couponRedemptions)
          .leftJoin(coupons, eq(couponRedemptions.couponId, coupons.id))
          .groupBy(couponRedemptions.couponId, coupons.code)
          .orderBy(desc(sql`count(*)`))
          .limit(5);

        const topCoupons = topCouponsResult.map(row => ({
          couponId: row.couponId,
          code: row.code,
          redemptionCount: Number(row.count),
        }));

        // Redemptions this month
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const redemptionsThisMonthResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(couponRedemptions)
          .where(gte(couponRedemptions.redeemedAt, firstDayOfMonth));
        const redemptionsThisMonth = Number(redemptionsThisMonthResult[0]?.count || 0);

        // Redemptions by day for last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

        const redemptionsByDayResult = await db
          .select({
            date: sql<string>`date(${couponRedemptions.redeemedAt})`,
            count: sql<number>`count(*)`,
          })
          .from(couponRedemptions)
          .where(gte(couponRedemptions.redeemedAt, thirtyDaysAgoISO))
          .groupBy(sql`date(${couponRedemptions.redeemedAt})`)
          .orderBy(sql`date(${couponRedemptions.redeemedAt})`);

        const redemptionsByDay = redemptionsByDayResult.map(row => ({
          date: row.date,
          count: Number(row.count),
        }));

        return NextResponse.json({
          totalRedemptions,
          uniqueUsers,
          uniqueEmails,
          totalDiscountGiven: Number(totalDiscountGiven.toFixed(2)),
          averageDiscountPerRedemption: Number(averageDiscountPerRedemption.toFixed(2)),
          topCoupons,
          redemptionsThisMonth,
          redemptionsByDay,
        }, { status: 200 });
      } catch (error) {
        console.error('GET stats error:', error);
        return NextResponse.json({ 
          error: 'Internal server error: ' + (error as Error).message 
        }, { status: 500 });
      }
    }

    // By coupon endpoint
    if (byCouponEndpoint) {
      try {
        const couponStatsResult = await db
          .select({
            couponId: coupons.id,
            code: coupons.code,
            type: coupons.type,
            value: coupons.value,
            currentUses: coupons.currentUses,
            maxUses: coupons.maxUses,
            active: coupons.active,
            redemptionCount: sql<number>`count(${couponRedemptions.id})`,
          })
          .from(coupons)
          .leftJoin(couponRedemptions, eq(coupons.id, couponRedemptions.couponId))
          .groupBy(
            coupons.id,
            coupons.code,
            coupons.type,
            coupons.value,
            coupons.currentUses,
            coupons.maxUses,
            coupons.active
          )
          .orderBy(desc(sql`count(${couponRedemptions.id})`));

        const couponStats = couponStatsResult.map(row => ({
          couponId: row.couponId,
          code: row.code,
          type: row.type,
          value: row.value,
          currentUses: row.currentUses,
          maxUses: row.maxUses,
          active: row.active,
          redemptionCount: Number(row.redemptionCount),
        }));

        return NextResponse.json(couponStats, { status: 200 });
      } catch (error) {
        console.error('GET by-coupon error:', error);
        return NextResponse.json({ 
          error: 'Internal server error: ' + (error as Error).message 
        }, { status: 500 });
      }
    }

    // Single redemption by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const redemptionId = parseInt(id);

      const redemptionResult = await db
        .select({
          id: couponRedemptions.id,
          couponId: couponRedemptions.couponId,
          userId: couponRedemptions.userId,
          email: couponRedemptions.email,
          orderId: couponRedemptions.orderId,
          redeemedAt: couponRedemptions.redeemedAt,
          couponCode: coupons.code,
          couponType: coupons.type,
          couponValue: coupons.value,
          orderNumber: orders.orderNumber,
          orderTotal: orders.total,
          discountAmount: orders.discountAmount,
          userName: user.name,
          userEmail: user.email,
        })
        .from(couponRedemptions)
        .leftJoin(coupons, eq(couponRedemptions.couponId, coupons.id))
        .leftJoin(orders, eq(couponRedemptions.orderId, orders.id))
        .leftJoin(user, eq(couponRedemptions.userId, user.id))
        .where(eq(couponRedemptions.id, redemptionId))
        .limit(1);

      if (redemptionResult.length === 0) {
        return NextResponse.json({ error: 'Redemption not found' }, { status: 404 });
      }

      const redemption = redemptionResult[0];

      return NextResponse.json({
        id: redemption.id,
        redeemedAt: redemption.redeemedAt,
        coupon: {
          id: redemption.couponId,
          code: redemption.couponCode,
          type: redemption.couponType,
          value: redemption.couponValue,
        },
        order: {
          id: redemption.orderId,
          orderNumber: redemption.orderNumber,
          total: redemption.orderTotal,
          discountAmount: redemption.discountAmount,
        },
        user: redemption.userId ? {
          id: redemption.userId,
          email: redemption.userEmail,
          name: redemption.userName,
        } : null,
        guestEmail: !redemption.userId ? redemption.email : null,
      }, { status: 200 });
    }

    // List redemptions with filters
    const couponId = searchParams.get('couponId');
    const couponCode = searchParams.get('couponCode');
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Validate parameters
    if (couponId && isNaN(parseInt(couponId))) {
      return NextResponse.json({ 
        error: "Valid couponId is required",
        code: "INVALID_COUPON_ID" 
      }, { status: 400 });
    }

    if (dateFrom) {
      const dateFromParsed = new Date(dateFrom);
      if (isNaN(dateFromParsed.getTime())) {
        return NextResponse.json({ 
          error: "Valid dateFrom is required (ISO date string)",
          code: "INVALID_DATE_FROM" 
        }, { status: 400 });
      }
    }

    if (dateTo) {
      const dateToParsed = new Date(dateTo);
      if (isNaN(dateToParsed.getTime())) {
        return NextResponse.json({ 
          error: "Valid dateTo is required (ISO date string)",
          code: "INVALID_DATE_TO" 
        }, { status: 400 });
      }
    }

    // Build where conditions
    const conditions = [];

    if (couponId) {
      conditions.push(eq(couponRedemptions.couponId, parseInt(couponId)));
    }

    if (userId) {
      conditions.push(eq(couponRedemptions.userId, userId));
    }

    if (email) {
      conditions.push(like(couponRedemptions.email, `%${email}%`));
    }

    if (dateFrom) {
      conditions.push(gte(couponRedemptions.redeemedAt, dateFrom));
    }

    if (dateTo) {
      const dateToEnd = new Date(dateTo);
      dateToEnd.setDate(dateToEnd.getDate() + 1);
      conditions.push(lte(couponRedemptions.redeemedAt, dateToEnd.toISOString()));
    }

    // Handle coupon code filter
    let couponIdFromCode: number | null = null;
    if (couponCode) {
      const couponResult = await db
        .select({ id: coupons.id })
        .from(coupons)
        .where(eq(coupons.code, couponCode))
        .limit(1);

      if (couponResult.length > 0) {
        couponIdFromCode = couponResult[0].id;
        conditions.push(eq(couponRedemptions.couponId, couponIdFromCode));
      } else {
        // No coupon found with this code, return empty results
        return NextResponse.json({
          redemptions: [],
          totalCount: 0,
          page: Math.floor(offset / limit) + 1,
        }, { status: 200 });
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(couponRedemptions)
      .where(whereClause);
    const totalCount = Number(countResult[0]?.count || 0);

    // Get redemptions with joins
    const redemptionsQuery = db
      .select({
        id: couponRedemptions.id,
        couponId: couponRedemptions.couponId,
        userId: couponRedemptions.userId,
        email: couponRedemptions.email,
        orderId: couponRedemptions.orderId,
        redeemedAt: couponRedemptions.redeemedAt,
        couponCode: coupons.code,
        couponType: coupons.type,
        couponValue: coupons.value,
        orderNumber: orders.orderNumber,
        orderTotal: orders.total,
        discountAmount: orders.discountAmount,
        userName: user.name,
        userEmail: user.email,
      })
      .from(couponRedemptions)
      .leftJoin(coupons, eq(couponRedemptions.couponId, coupons.id))
      .leftJoin(orders, eq(couponRedemptions.orderId, orders.id))
      .leftJoin(user, eq(couponRedemptions.userId, user.id))
      .orderBy(desc(couponRedemptions.redeemedAt))
      .limit(limit)
      .offset(offset);

    if (whereClause) {
      redemptionsQuery.where(whereClause);
    }

    const redemptionsResult = await redemptionsQuery;

    const redemptions = redemptionsResult.map(row => ({
      id: row.id,
      redeemedAt: row.redeemedAt,
      coupon: {
        id: row.couponId,
        code: row.couponCode,
        type: row.couponType,
        value: row.couponValue,
      },
      order: {
        id: row.orderId,
        orderNumber: row.orderNumber,
        total: row.orderTotal,
        discountAmount: row.discountAmount,
      },
      user: row.userId ? {
        id: row.userId,
        email: row.userEmail,
        name: row.userName,
      } : null,
      guestEmail: !row.userId ? row.email : null,
    }));

    return NextResponse.json({
      redemptions,
      totalCount,
      page: Math.floor(offset / limit) + 1,
    }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}