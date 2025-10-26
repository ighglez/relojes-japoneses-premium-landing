import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { db } from "@/db";
import { leads } from "@/db/schema";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre, email, modelo, mensaje } = body;

    if (!nombre || !email || !modelo) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Save lead to database
    await db.insert(leads).values({
      email,
      name: nombre,
      model: modelo,
      message: mensaje || null,
      source: "watch_inquiry",
      ts: new Date().toISOString(),
    });

    // Send email notification
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM || "IWatches <onboarding@resend.dev>",
        to: process.env.RESEND_FROM || "onboarding@resend.dev",
        subject: `Nueva consulta: ${modelo}`,
        html: `
          <h2>Nueva consulta de reloj</h2>
          <p><strong>Nombre:</strong> ${nombre}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Modelo:</strong> ${modelo}</p>
          <p><strong>Mensaje:</strong> ${mensaje || "Sin mensaje"}</p>
        `,
      });
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      // Continue even if email fails
    }

    return NextResponse.json(
      { message: "Inquiry submitted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing inquiry:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
