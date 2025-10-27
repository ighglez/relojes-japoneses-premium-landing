export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { db } from "@/db";
import { leads } from "@/db/schema";
import { z } from "zod";

// 1) Validación fuerte (zod)
const ContactSchema = z.object({
  nombre: z.string().min(2).max(80),
  email: z.string().email().max(160),
  mensaje: z.string().min(5).max(3000),
});

// 2) Antispam básico: rate-limit por IP + honeypot
const WINDOW_MS = 1000 * 60 * 2; // 2 min
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

    // Honeypot (si envías un campo oculto "website" vacío en el front)
    const raw = await request.json().catch(() => null);
    if (!raw) {
      return NextResponse.json({ error: "Bad Request" }, { status: 400 });
    }
    if (typeof raw.website === "string" && raw.website.trim() !== "") {
      // Bot detectado
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // Rate limit muy simple en memoria (válido para Vercel por instancia; suficiente como primera capa)
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests, try again later." },
        { status: 429 }
      );
    }

    // Validación de payload
    const parsed = ContactSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid fields", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { nombre, email, mensaje } = parsed.data;

    // 3) Persistencia (manejo de errores independiente)
    try {
      await db.insert(leads).values({
        email,
        name: nombre,
        message: mensaje,
        source: "contact_form",
        ts: new Date().toISOString(),
        // opcional: guarda ip
        // @ts-ignore si tu schema no tiene campo
        ip,
      });
    } catch (dbErr) {
      // No bloquees al usuario si la base falla: registra y continúa
      console.error("[contact] DB insert error:", dbErr);
    }

    // 4) Envío de correo (solo si hay credenciales)
    const RESEND_KEY = process.env.RESEND_API_KEY;
    const FROM = process.env.RESEND_FROM || "IWatches <onboarding@resend.dev>";
    const TO = process.env.RESEND_FROM || "onboarding@resend.dev";

    if (RESEND_KEY) {
      try {
        const resend = new Resend(RESEND_KEY);

        // Incluye versión texto por accesibilidad y filtros antispam
        const textBody = [
          `Nuevo mensaje de contacto`,
          `Nombre: ${nombre}`,
          `Email: ${email}`,
          `IP: ${ip}`,
          ``,
          `Mensaje:`,
          mensaje,
        ].join("\n");

        await resend.emails.send({
          from: FROM,                  // debe ser un remitente verificado en Resend
          to: Array.isArray(TO) ? TO : [TO],
          reply_to: email,             // para poder responder al cliente
          subject: `Contacto web: ${nombre}`,
          text: textBody,
          html: `
            <h2 style="margin:0 0 12px">Nuevo mensaje de contacto</h2>
            <p><strong>Nombre:</strong> ${escapeHtml(nombre)}</p>
            <p><strong>Email:</strong> ${escapeHtml(email)}</p>
            <p><strong>IP:</strong> ${escapeHtml(ip)}</p>
            <p><strong>Mensaje:</strong></p>
            <p style="white-space:pre-line">${escapeHtml(mensaje)}</p>
          `,
        });
      } catch (mailErr) {
        console.error("[contact] Resend error:", mailErr);
        // no fallamos la request por error de email
      }
    }

    // 5) Respuesta final
    return NextResponse.json(
      { ok: true, message: "Mensaje recibido. Te contactaremos en breve." },
      { status: 200 }
    );
  } catch (err) {
    console.error("[contact] Fatal error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Pequeño helper para evitar HTML injection en el email
function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
