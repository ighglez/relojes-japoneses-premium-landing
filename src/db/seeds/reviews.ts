import { db } from "@/db";
import { reviews } from "@/db/schema";

async function main() {
  const sampleReviews = [
    {
      name: "Mateo Gracia",
      city: "Logroño, España",
      text:
        "Todo el proceso fue impecable. Ignacio me explicó cada detalle del reloj y del pedido, y el Seiko llegó exactamente como se describía: nuevo, con garantía y un empaquetado muy cuidado. El tono dorado del SSK021K1 en persona es espectacular. Sin duda repetiré.",
      approved: true,
      createdAt: "2025-09-07T10:15:00.000Z",
    },
    {
      name: "Alberto Pérez",
      city: "Valladolid, España",
      text:
        "Tenía mis dudas al principio, pero la comunicación fue constante y profesional. El reloj llegó en el plazo indicado y con su factura. Se nota la calidad con la que trabajan.",
      approved: true,
      createdAt: "2025-09-18T11:20:00.000Z",
    },
    {
      name: "Oscar Soto",
      city: "Valencia, España",
      text:
        "Servicio impecable. Reloj original, con su caja, papeles y envío rápido. La comunicación fue cercana y transparente en todo momento y el trato recibido marca la diferencia.",
      approved: true,
      createdAt: "2025-10-02T09:05:00.000Z",
    },
    {
      name: "Pablo Velasco",
      city: "León, España",
      text:
        "Es el segundo Seiko que compro con ellos y todo perfecto. El SSK005K1 con esfera naranja es aún más impresionante en vivo. Ignacio me mandó fotos antes del envío y todo llegó en perfecto estado; se nota que se preocupan por el cliente.",
      approved: true,
      createdAt: "2025-10-12T18:40:00.000Z",
    },
    {
      name: "Carlos González",
      city: "Cádiz, España",
      text:
        "Buscaba el modelo Panda desde hacía meses y aquí lo encontré nuevo, a un precio competitivo y con un trato excelente. Me enviaron la factura, el número de seguimiento y fotos antes del envío. Experiencia de 10, muy profesional.",
      approved: true,
      createdAt: "2025-10-23T14:10:00.000Z",
    },
  ];

  await db.insert(reviews).values(sampleReviews);
  console.log("✅ Reviews seeder completed successfully");
}

main().catch((error) => {
  console.error("❌ Seeder failed:", error);
});
