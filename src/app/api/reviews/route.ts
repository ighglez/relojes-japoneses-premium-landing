import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reviews } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0; // CRÍTICO: Sin caché

export async function GET(request: NextRequest) {
  try {
    // Headers para prevenir caché
    const headers = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Content-Type': 'application/json',
    };

    const allReviews = await db
      .select()
      .from(reviews)
      .where(eq(reviews.approved, true))
      .orderBy(desc(reviews.createdAt));

    console.log(`[Reviews API] Found ${allReviews.length} approved reviews`);

    return NextResponse.json(
      { reviews: allReviews, count: allReviews.length }, 
      { status: 200, headers }
    );
  } catch (error) {
    console.error("[Reviews API] Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Internal server error", reviews: [], count: 0 }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre, ciudad, texto } = body;

    if (!nombre || !ciudad || !texto) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newReview = await db.insert(reviews).values({
      name: nombre,
      city: ciudad,
      text: texto,
      approved: true,
      createdAt: new Date().toISOString(),
    }).returning();

    console.log(`[Reviews API] New review created:`, newReview[0]);

    return NextResponse.json(
      { message: "Review submitted successfully", review: newReview[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Reviews API] Error submitting review:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}