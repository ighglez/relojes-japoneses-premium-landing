import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { db } from "@/db";
import { leads } from "@/db/schema";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, source } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Save to database
    await db.insert(leads).values({
      email,
      source: source || "newsletter",
      ts: new Date().toISOString(),
    });

    // Send welcome email
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM || "IWatches <onboarding@resend.dev>",
        to: email,
        subject: "Bienvenido a IWatches",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #C6A664;">¡Bienvenido a IWatches!</h1>
            <p>Gracias por suscribirte a nuestro newsletter.</p>
            ${source === "catalog_download" ? `
              <p>Como prometido, aquí está tu código de descuento del 5%:</p>
              <div style="background: #F9F9F7; padding: 20px; text-align: center; margin: 20px 0;">
                <strong style="font-size: 24px; color: #C6A664;">WELCOME5</strong>
              </div>
              <p>Usa este código en tu primera compra.</p>
            ` : ""}
            <p>Recibirás lanzamientos exclusivos y ofertas especiales antes que nadie.</p>
            <p style="margin-top: 30px; color: #666; font-size: 12px;">
              Puedes darte de baja en cualquier momento.
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Error sending welcome email:", emailError);
      // Continue even if email fails
    }

    return NextResponse.json(
      { message: "Newsletter subscription successful" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing newsletter subscription:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
