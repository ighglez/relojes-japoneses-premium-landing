import { db } from '@/db';
import { reviews } from '@/db/schema';

async function main() {
    const sampleReviews = [
        {
            name: 'Carlos González',
            city: 'Madrid, España',
            text: 'Excelente experiencia comprando mi Seiko Presage. La comunicación fue perfecta durante todo el proceso, el reloj llegó en perfectas condiciones con toda su documentación original. El empaquetado muy cuidado y la entrega más rápida de lo esperado. Totalmente recomendable para cualquiera que busque un reloj automático de calidad.',
            approved: true,
            createdAt: '2024-09-15T10:00:00.000Z',
        },
        {
            name: 'María López',
            city: 'Barcelona, España',
            text: 'Compré un Seiko 5 Sports y estoy encantada. El vendedor respondió todas mis dudas con paciencia y profesionalidad. El reloj llegó en una semana, perfectamente embalado con caja original y garantía internacional. La autenticidad del producto es indudable, se nota la calidad japonesa en cada detalle.',
            approved: true,
            createdAt: '2024-10-22T14:30:00.000Z',
        },
        {
            name: 'Javier Martínez',
            city: 'Valencia, España',
            text: 'Mi segundo Seiko automático comprado aquí, esta vez un Prospex Diver. Servicio impecable como siempre, el seguimiento del envío fue transparente y el packaging de primera calidad. El reloj llegó exactamente como se describía, con todos los papeles y enlaces originales. Sin duda volveré para mi próxima compra.',
            approved: true,
            createdAt: '2024-11-08T16:45:00.000Z',
        },
        {
            name: 'Ana Ruiz',
            city: 'Sevilla, España',
            text: 'Fantástica experiencia adquiriendo un Seiko Cocktail Time para mi marido. La atención al cliente fue excepcional, me asesoraron perfectamente sobre el modelo. La entrega fue rapidísima, solo tres días, y el estado del reloj impecable. Viene con garantía oficial y toda la documentación en regla.',
            approved: true,
            createdAt: '2024-12-01T09:20:00.000Z',
        },
        {
            name: 'Pablo Navarro',
            city: 'Bilbao, España',
            text: 'Compré un Seiko Alpinist y superó todas mis expectativas. El proceso de compra fue muy sencillo, el vendedor muy atento y profesional en todo momento. El reloj llegó protegido con triple embalaje, en su caja original con manuales y certificado de autenticidad. Relación calidad-precio insuperable, totalmente satisfecho.',
            approved: true,
            createdAt: '2024-12-18T11:15:00.000Z',
        },
    ];

    await db.insert(reviews).values(sampleReviews);

    console.log('✅ Reviews seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});