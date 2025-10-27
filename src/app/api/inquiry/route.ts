export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { db } from "@/db";
import { leads } from "@/db/schema";
import { z } from "zod";

// Validación estricta con zod
const InquirySchema = z.object({
  nombre: z.string().min(2).max(80),
  email: z.string().email().max(160),
  modelo: z.string().min(2).max(160),
  mensaje: z.string().max(2000).optional().nullable(),
});

// Rate-limit básico (memoria temporal)
const WINDOW_MS = 1000 * 60 * 2; // 2 minutos
const MAX_PER_WINDOW = 3;
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

    // Leer cuerpo y validar
    const raw = await request.json().catch(() => null);
    if (!raw) {
      return NextResponse.json({ error: "Bad Request" }, { status: 400 });
    }

    // Honeypot (si en el front hay un campo oculto "website")
    if (typeof raw.website === "string" && raw.website.trim() !== "") {
      // Bot detectado, devolvemos OK silencioso
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests, please try again later." },
        { status: 429 }
      );
    }

    const parsed = InquirySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid fields", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { nombre, email, modelo, mensaje } = parsed.data;

    // Guardar en base de datos
    try {
      await db.insert(leads).values({
        email,
        name: nombre,
        model: modelo,
        message: mensaje || null,
        source: "watch_inquiry",
        ts: new Date().toISOString(),
        // @ts-ignore si tu schema no tiene IP
        ip,
      });
    } catch (dbErr) {
      console.error("[inquiry] DB insert error:", dbErr);
      // No bloqueamos si falla la DB
    }

    // Configurar Resend
    const RESEND_KEY = process.env.RESEND_API_KEY;
    const FROM = process.env.RESEND_FROM || "IWatches <onboarding@resend.dev>";
    const TO = process.env.RESEND_FROM || "onboarding@resend.dev";

    if (RESEND_KEY) {
      try {
        const resend = new Resend(RESEND_KEY);

        const textBody = [
          `Nueva consulta de reloj`,
          `Nombre: ${nombre}`,
          `Email: ${email}`,
          `Modelo: ${modelo}`,
          `IP: ${ip}`,
          "",
          `Mensaje: ${mensaje || "Sin mensaje adicional."}`,
        ].join("\n");

        await resend.emails.send({
          from: FROM,
          to: Array.isArray(TO) ? TO : [TO],
          reply_to: email,
          subject: `Nueva consulta: ${modelo}`,
          text: textBody,
          html: `
            <h2 style="margin:0 0 12px;">Nueva consulta de reloj</h2>
            <p><strong>Nombre:</strong> ${escapeHtml(nombre)}</p>
            <p><strong>Email:</strong> ${escapeHtml(email)}</p>
            <p><strong>Modelo:</strong> ${escapeHtml(modelo)}</p>
            <p><strong>IP:</strong> ${escapeHtml(ip)}</p>
            <p><strong>Mensaje:</strong></p>
            <p style="white-space:pre-line;">${escapeHtml(mensaje || "Sin mensaje adicional.")}</p>
          `,
        });
      } catch (mailErr) {
        console.error("[inquiry] Resend error:", mailErr);
        // No lanzamos error al usuario
      }
    }

    return NextResponse.json(
      { ok: true, message: "Consulta enviada correctamente." },
      { status: 200 }
    );
  } catch (err) {
    console.error("[inquiry] Fatal error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Pequeño helper para limpiar HTML
function escapeHtml(str?: string | null) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
