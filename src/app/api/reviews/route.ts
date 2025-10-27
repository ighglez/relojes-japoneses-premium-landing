import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reviews } from "@/db/schema";
import { desc } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AnyRow = {
  id?: number;
  name?: string;
  city?: string;
  text?: string;
  testimonial?: string; // por compatibilidad con seeds antiguos
  approved?: boolean | number | string | null;
  createdAt?: string | null;
};

export async function GET() {
  try {
    // 1) Trae TODO y filtra en memoria para esquemas antiguos o datos inconsistentes
    const rows = (await db.select().from(reviews)) as unknown as AnyRow[];

    // 2) Normaliza: usa `text` o `testimonial`, coerciona `approved`, asegura `createdAt`
    const normalized = rows
      .map((r) => {
        const approved =
          r.approved === true ||
          r.approved === 1 ||
          r.approved === "1" ||
          r.approved === "true" ||
          r.approved === undefined ||
          r.approved === null; // si no existe el campo, no bloqueamos
        return {
          id: r.id ?? 0,
          name: r.name ?? "",
          city: r.city ?? "",
          text: (r.text ?? r.testimonial ?? "").toString(),
          approved,
          createdAt: r.createdAt ?? null,
        };
      })
      .filter((r) => r.text.trim().length > 0 && r.approved);

    // 3) Ordena por fecha (si falta, caemos al final)
    normalized.sort((a, b) => {
      const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
      const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
      return tb - ta;
    });

    // 4) Devuelve 200 SIEMPRE con array (vacío si no hay)
    return NextResponse.json({ reviews: normalized }, { status: 200 });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    // fallback sin romper el front
    return NextResponse.json({ reviews: [] }, { status: 200 });
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
      text: texto,          // siempre guardamos en `text`
      approved: true,       // publicadas directamente
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json(
      { message: "Review submitted successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error submitting review:", error);
    // no rompas el front si algo falla al crear
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
