import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reviews } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// Asegura que este handler se ejecute en Node.js (no en Edge)
export const runtime = "nodejs";
// Evita prerender y caching del handler en build
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const allReviews = await db
      .select()
      .from(reviews)
      .where(eq(reviews.approved, true))
      .orderBy(desc(reviews.createdAt)); // más reciente primero

    return NextResponse.json({ reviews: allReviews }, { status: 200 });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    // Si prefieres ver el estado vacío en el front en vez de error rojo, descomenta la línea siguiente y cambia el status a 200.
    // return NextResponse.json({ reviews: [] }, { status: 200 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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

    await db.insert(reviews).values({
      name: nombre,
      city: ciudad,
      text: texto,
      approved: true, // déjalo en false si vas a moderar; pon true temporalmente si quieres verlas de inmediato
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json(
      { message: "Review submitted successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error submitting review:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
