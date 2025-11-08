import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, orderItems } from '@/db/schema';
import { eq, like, and, or, desc, asc, gte, lte, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const statsEndpoint = request.url.endsWith('/stats');

    // Handle /api/admin/orders/stats endpoint
    if (statsEndpoint) {
      // Calculate total orders
      const totalOrdersResult = await db.select({ count: sql<number>`count(*)` })
        .from(orders);
      const totalOrders = totalOrdersResult[0]?.count || 0;

      // Calculate total revenue
      const totalRevenueResult = await db.select({ sum: sql<number>`sum(${orders.total})` })
        .from(orders);
      const totalRevenue = totalRevenueResult[0]?.sum || 0;

      // Calculate orders by status
      const ordersByStatusResult = await db.select({
        status: orders.status,
        count: sql<number>`count(*)`
      })
        .from(orders)
        .groupBy(orders.status);
      
      const ordersByStatus: Record<string, number> = {};
      ordersByStatusResult.forEach(row => {
        ordersByStatus[row.status] = row.count;
      });

      // Calculate average order value
      const averageOrderValueResult = await db.select({ avg: sql<number>`avg(${orders.total})` })
        .from(orders);
      const averageOrderValue = averageOrderValueResult[0]?.avg || 0;

      // Get current month boundaries
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

      // Orders this month
      const ordersThisMonthResult = await db.select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(and(
          gte(orders.createdAt, firstDayOfMonth),
          lte(orders.createdAt, lastDayOfMonth)
        ));
      const ordersThisMonth = ordersThisMonthResult[0]?.count || 0;

      // Revenue this month
      const revenueThisMonthResult = await db.select({ sum: sql<number>`sum(${orders.total})` })
        .from(orders)
        .where(and(
          gte(orders.createdAt, firstDayOfMonth),
          lte(orders.createdAt, lastDayOfMonth)
        ));
      const revenueThisMonth = revenueThisMonthResult[0]?.sum || 0;

      return NextResponse.json({
        totalOrders,
        totalRevenue,
        ordersByStatus,
        averageOrderValue,
        ordersThisMonth,
        revenueThisMonth
      }, { status: 200 });
    }

    // Handle single order by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({
          error: 'Valid ID is required',
          code: 'INVALID_ID'
        }, { status: 400 });
      }

      const order = await db.select()
        .from(orders)
        .where(eq(orders.id, parseInt(id)))
        .limit(1);

      if (order.length === 0) {
        return NextResponse.json({
          error: 'Order not found',
          code: 'ORDER_NOT_FOUND'
        }, { status: 404 });
      }

      // Get order items
      const items = await db.select()
        .from(orderItems)
        .where(eq(orderItems.orderId, parseInt(id)));

      return NextResponse.json({
        ...order[0],
        items
      }, { status: 200 });
    }

    // Handle list all orders with filters
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const paymentMethod = searchParams.get('paymentMethod');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const minTotal = searchParams.get('minTotal');
    const maxTotal = searchParams.get('maxTotal');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const sortField = searchParams.get('sort') ?? 'createdAt';
    const sortOrder = searchParams.get('order') ?? 'desc';

    // Validate sort parameters
    if (!['createdAt', 'total', 'orderNumber'].includes(sortField)) {
      return NextResponse.json({
        error: 'Invalid sort field. Must be one of: createdAt, total, orderNumber',
        code: 'INVALID_SORT_FIELD'
      }, { status: 400 });
    }

    if (!['asc', 'desc'].includes(sortOrder)) {
      return NextResponse.json({
        error: 'Invalid sort order. Must be asc or desc',
        code: 'INVALID_SORT_ORDER'
      }, { status: 400 });
    }

    // Validate date parameters
    if (dateFrom && isNaN(Date.parse(dateFrom))) {
      return NextResponse.json({
        error: 'Invalid dateFrom parameter. Must be valid ISO date string',
        code: 'INVALID_DATE_FROM'
      }, { status: 400 });
    }

    if (dateTo && isNaN(Date.parse(dateTo))) {
      return NextResponse.json({
        error: 'Invalid dateTo parameter. Must be valid ISO date string',
        code: 'INVALID_DATE_TO'
      }, { status: 400 });
    }

    // Validate total parameters
    if (minTotal && (isNaN(parseFloat(minTotal)) || parseFloat(minTotal) < 0)) {
      return NextResponse.json({
        error: 'Invalid minTotal parameter. Must be numeric and >= 0',
        code: 'INVALID_MIN_TOTAL'
      }, { status: 400 });
    }

    if (maxTotal && (isNaN(parseFloat(maxTotal)) || parseFloat(maxTotal) < 0)) {
      return NextResponse.json({
        error: 'Invalid maxTotal parameter. Must be numeric and >= 0',
        code: 'INVALID_MAX_TOTAL'
      }, { status: 400 });
    }

    // Build filter conditions
    const conditions = [];

    if (status) {
      conditions.push(eq(orders.status, status));
    }

    if (search) {
      conditions.push(
        or(
          like(orders.orderNumber, `%${search}%`),
          like(orders.guestEmail, `%${search}%`),
          like(orders.shippingEmail, `%${search}%`),
          like(orders.shippingName, `%${search}%`)
        )
      );
    }

    if (paymentMethod) {
      conditions.push(eq(orders.paymentMethod, paymentMethod));
    }

    if (dateFrom) {
      conditions.push(gte(orders.createdAt, dateFrom));
    }

    if (dateTo) {
      // Include the entire day by adding time if not present
      const dateToInclusive = dateTo.includes('T') ? dateTo : `${dateTo}T23:59:59.999Z`;
      conditions.push(lte(orders.createdAt, dateToInclusive));
    }

    if (minTotal) {
      conditions.push(gte(orders.total, parseFloat(minTotal)));
    }

    if (maxTotal) {
      conditions.push(lte(orders.total, parseFloat(maxTotal)));
    }

    // Build query with filters
    let query = db.select().from(orders);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    const sortColumn = sortField === 'createdAt' ? orders.createdAt :
                      sortField === 'total' ? orders.total :
                      orders.orderNumber;
    
    query = query.orderBy(sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn));

    // Get total count for pagination
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(orders);
    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }
    const totalCountResult = await countQuery;
    const totalCount = totalCountResult[0]?.count || 0;

    // Apply pagination
    const ordersResult = await query.limit(limit).offset(offset);

    // Fetch order items for each order
    const ordersWithItems = await Promise.all(
      ordersResult.map(async (order) => {
        const items = await db.select()
          .from(orderItems)
          .where(eq(orderItems.orderId, order.id));

        // Calculate additional fields
        const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
        const createdDate = new Date(order.createdAt);
        const now = new Date();
        const daysSinceCreated = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

        return {
          ...order,
          items,
          itemCount,
          daysSinceCreated
        };
      })
    );

    return NextResponse.json({
      orders: ordersWithItems,
      totalCount,
      page: Math.floor(offset / limit) + 1,
      limit
    }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error))
    }, { status: 500 });
  }
}