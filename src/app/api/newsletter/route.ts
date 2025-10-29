export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { db } from "@/db";
import { newsletterSubscribers } from "@/db/schema";
import { z } from "zod";
import { eq } from "drizzle-orm";

// Validación estricta
const NewsletterSchema = z.object({
  email: z.string().email().max(160),
  source: z.enum(["newsletter", "catalog_download", "popup_5", "footer", "registration", "other"]).optional().default("newsletter"),
  // Campo honeypot opcional desde el front (un input hidden llamado "website")
  website: z.string().optional(),
});

// Anti-spam simple en memoria (suficiente como primera capa)
const WINDOW_MS = 1000 * 60 * 2; // 2 minutos
const MAX_PER_WINDOW = 5;
const rateMap = new Map<string, { count: number; ts: number }>();

function getClientIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.ip ||
    "0.0.0.0"
  );
}

function isRateLimited(ip: string) {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry) {
    rateMap.set(ip, { count: 1, ts: now });
    return false;
  }
  if (now - entry.ts > WINDOW_MS) {
    rateMap.set(ip, { count: 1, ts: now });
    return false;
  }
  entry.count++;
  rateMap.set(ip, entry);
  return entry.count > MAX_PER_WINDOW;
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);

    const raw = await request.json().catch(() => null);
    if (!raw) {
      return NextResponse.json({ error: "Bad Request" }, { status: 400 });
    }

    // Honeypot: si "website" viene con contenido, tratamos como bot y devolvemos OK silencioso
    if (typeof raw.website === "string" && raw.website.trim() !== "") {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests, please try again later." },
        { status: 429 }
      );
    }

    const parsed = NewsletterSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid fields", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, source } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Verificar si el email ya existe
    try {
      const existing = await db
        .select()
        .from(newsletterSubscribers)
        .where(eq(newsletterSubscribers.email, normalizedEmail))
        .limit(1);

      if (existing.length > 0) {
        // Email ya suscrito - devolver éxito sin enviar email duplicado
        return NextResponse.json(
          { ok: true, message: "Ya estás suscrito a nuestra newsletter.", alreadySubscribed: true },
          { status: 200 }
        );
      }

      // Insertar nuevo suscriptor
      await db.insert(newsletterSubscribers).values({
        email: normalizedEmail,
        source,
        createdAt: new Date().toISOString(),
      });
    } catch (dbErr: any) {
      console.error("[newsletter] DB error:", dbErr);
      
      // Si es error de unicidad, manejar graciosamente
      if (dbErr?.message?.includes("UNIQUE") || dbErr?.code === "SQLITE_CONSTRAINT") {
        return NextResponse.json(
          { ok: true, message: "Ya estás suscrito a nuestra newsletter.", alreadySubscribed: true },
          { status: 200 }
        );
      }
      
      throw dbErr;
    }

    // Email de bienvenida
    const RESEND_KEY = process.env.RESEND_API_KEY;
    const FROM = process.env.RESEND_FROM || "IWatchWorks <onboarding@resend.dev>";

    if (RESEND_KEY) {
      try {
        const resend = new Resend(RESEND_KEY);

        const showDiscount = source === "catalog_download" || source === "popup_5" || source === "registration";
        const discountCode = showDiscount ? "WELCOME5" : undefined;

        const textBody = [
          "¡Bienvenido a IWatchWorks!",
          "Gracias por suscribirte.",
          showDiscount ? "Tu código de descuento del 5%: WELCOME5" : "",
          "",
          "Recibirás lanzamientos exclusivos y novedades seleccionadas.",
          "Puedes darte de baja en cualquier momento.",
        ]
          .filter(Boolean)
          .join("\n");

        const htmlBody = `
          <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; line-height:1.6;">
            <h1 style="color:#C6A664; margin: 0 0 16px;">¡Bienvenido a IWatchWorks!</h1>
            <p>Gracias por suscribirte${source === "footer" ? " desde el pie de página" : source === "registration" ? " al crear tu cuenta" : ""}. Seleccionamos piezas por su equilibrio entre diseño, fiabilidad y legado relojero.</p>
            ${
              showDiscount
                ? `
            <p style="margin: 20px 0 8px;">Como prometido, aquí tienes tu código de descuento del 5%:</p>
            <div style="background:#F9F9F7; padding:18px; text-align:center; border:1px solid #EAEAEA;">
              <strong style="font-size:22px; letter-spacing:1px; color:#C6A664;">${discountCode}</strong>
            </div>
            <p style="margin: 8px 0 0;">Úsalo en tu primera compra.</p>
            `
                : ""
            }
            <p style="margin-top: 20px;">Recibirás lanzamientos exclusivos y noticias antes que nadie.</p>
            <p style="margin-top: 28px; color:#666; font-size:12px;">Puedes darte de baja en cualquier momento.</p>
          </div>
        `;

        await resend.emails.send({
          from: FROM,
          to: [normalizedEmail],
          subject: "Bienvenido a IWatchWorks",
          text: textBody,
          html: htmlBody,
        });
      } catch (mailErr) {
        console.error("[newsletter] Resend error:", mailErr);
        // No fallamos la request por el email
      }
    }

    return NextResponse.json(
      { ok: true, message: "Suscripción realizada correctamente." },
      { status: 200 }
    );
  } catch (err) {
    console.error("[newsletter] Fatal error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}