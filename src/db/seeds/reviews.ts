import { db } from '@/db';
import { reviews } from '@/db/schema';

async function main() {
    const sampleReviews = [
        {
            name: 'Carlos Martínez',
            city: 'Madrid',
            testimonial: 'Excelente servicio y relojes auténticos. Compré un Seiko Presage y la calidad es excepcional. Muy recomendable para cualquier amante de los relojes de lujo.',
            approved: true,
            createdAt: new Date().toISOString(),
        },
        {
            name: 'Elena González',
            city: 'Barcelona',
            testimonial: 'La atención al cliente es impecable y la entrega fue muy rápida. Mi Seiko Grand Seiko llegó en perfectas condiciones. Sin duda volveré a comprar aquí.',
            approved: true,
            createdAt: new Date().toISOString(),
        },
        {
            name: 'Javier López',
            city: 'Valencia',
            testimonial: 'Profesionalismo de primer nivel. El reloj Seiko Prospex que adquirí es de una calidad extraordinaria. La autenticidad está garantizada y el proceso de compra fue muy sencillo.',
            approved: true,
            createdAt: new Date().toISOString(),
        },
        {
            name: 'María Rodríguez',
            city: 'Sevilla',
            testimonial: 'Increíble experiencia de compra. El Seiko Astron que pedí superó todas mis expectativas. Entrega rápida y producto auténtico de la más alta calidad.',
            approved: true,
            createdAt: new Date().toISOString(),
        },
        {
            name: 'Antonio Fernández',
            city: 'Bilbao',
            testimonial: 'Distribuidor confiable con relojes originales. Mi Seiko Presage Cocktail Time es simplemente magnífico. Excelente servicio postventa y asesoramiento profesional.',
            approved: true,
            createdAt: new Date().toISOString(),
        }
    ];

    await db.insert(reviews).values(sampleReviews);
    
    console.log('✅ Reviews seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});