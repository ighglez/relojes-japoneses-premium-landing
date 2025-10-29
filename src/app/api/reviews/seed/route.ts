import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { reviews } from '@/db/schema';
import { sql } from 'drizzle-orm';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RESEÑAS_REALES = [
  {
    name: "Mateo Gracia",
    city: "Logroño, España",
    text: "Todo el proceso fue impecable. Ignacio me explicó cada detalle del reloj y del pedido, y el Seiko llegó exactamente como se describía: nuevo, con garantía y un empaquetado muy cuidado. El tono dorado del SSK021K1 en persona es espectacular. Sin duda repetiré.",
    approved: true,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    name: "Alberto Pérez",
    city: "Valladolid, España",
    text: "Tenía mis dudas al principio, pero la comunicación fue constante y profesional. El reloj llegó en el plazo indicado y con su factura. Se nota la calidad con la que trabajan.",
    approved: true,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    name: "Oscar Soto",
    city: "Valencia, España",
    text: "Servicio impecable. Reloj original, con su caja, papeles y envío rápido. La comunicación fue cercana y transparente en todo momento y el trato recibido marca la diferencia.",
    approved: true,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    name: "Carlos González",
    city: "Cádiz, España",
    text: "Es el segundo Seiko que compro con ellos y todo perfecto. El SSK005K1 con esfera naranja es aún más impresionante en vivo. Ignacio me mandó fotos antes del envío y todo llegó en perfecto estado se nota que se preocupan por el cliente.",
    approved: true,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    name: "Pablo Velasco",
    city: "León, España",
    text: "Buscaba el modelo Panda desde hacía meses y aquí lo encontré nuevo, a un precio competitivo y con un trato excelente. Me enviaron la factura, el número de seguimiento y fotos antes del envío. Experiencia de 10, muy profesional.",
    approved: true,
    createdAt: new Date().toISOString(),
  },
];

export async function POST(request: NextRequest) {
  try {
    const seedSecret = request.headers.get('x-seed-secret');
    
    if (!seedSecret || seedSecret !== 'iwatchworks_seed_2025') {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'INVALID_SEED_SECRET' },
        { status: 401 }
      );
    }

    const countResult = await db.select({ count: sql<number>`count(*)` }).from(reviews);
    const existingCount = countResult[0]?.count || 0;

    if (existingCount > 0) {
      return NextResponse.json(
        { 
          message: 'Reviews already seeded', 
          count: existingCount 
        },
        { status: 200 }
      );
    }

    await db.insert(reviews).values(RESEÑAS_REALES);

    return NextResponse.json(
      { 
        message: 'Seeded 5 reviews successfully', 
        count: 5 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('POST /api/seed/reviews error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}