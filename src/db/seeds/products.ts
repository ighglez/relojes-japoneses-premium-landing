import { db } from '@/db';
import { products } from '@/db/schema';

async function main() {
    const timestamp = new Date().toISOString();
    
    const sampleProducts = [
        {
            name: 'Seiko Presage Cocktail Time "Blue Moon"',
            brand: 'Seiko',
            reference: 'SRPB41J1',
            description: 'The iconic Presage Cocktail Time with its stunning blue dial inspired by moonlight cocktails. Features automatic movement, power reserve indicator, and exhibition caseback showcasing Japanese craftsmanship.',
            imageUrl: 'https://placehold.co/600x600/F9F9F7/C6A664?text=SRPB41J1',
            price: 449.00,
            stock: 8,
            category: 'Dress',
            features: [
                'Automatic 4R57 movement',
                'Power reserve indicator',
                'Exhibition caseback',
                'Sapphire crystal',
                '50m water resistance'
            ],
            isFeatured: true,
            createdAt: timestamp,
            updatedAt: timestamp,
        },
        {
            name: 'Seiko Prospex Diver "Black Series"',
            brand: 'Seiko',
            reference: 'SPB313J1',
            description: 'Professional dive watch with ISO certification. Black ceramic bezel, automatic movement, and 200m water resistance. Built for serious divers and enthusiasts.',
            imageUrl: 'https://placehold.co/600x600/F9F9F7/C6A664?text=SPB313J1',
            price: 799.00,
            stock: 5,
            category: 'Diver',
            features: [
                'Automatic 6R35 movement',
                'Ceramic bezel',
                '200m water resistance',
                'Luminous hands',
                'ISO 6425 certified'
            ],
            isFeatured: true,
            createdAt: timestamp,
            updatedAt: timestamp,
        },
        {
            name: 'Seiko 5 Sports "Field Watch"',
            brand: 'Seiko',
            reference: 'SRPG13K1',
            description: 'Versatile field watch with automatic movement and day-date display. Perfect for everyday wear with military-inspired design and 100m water resistance.',
            imageUrl: 'https://placehold.co/600x600/F9F9F7/C6A664?text=SRPG13K1',
            price: 279.00,
            stock: 12,
            category: 'Sports',
            features: [
                'Automatic 4R36 movement',
                'Day-date display',
                '100m water resistance',
                'Luminous markers',
                'Nylon strap'
            ],
            isFeatured: false,
            createdAt: timestamp,
            updatedAt: timestamp,
        },
        {
            name: 'Seiko Presage "Sharp Edged GMT"',
            brand: 'Seiko',
            reference: 'SPB221J1',
            description: 'Sophisticated GMT watch with sharp angular case design. Dual time zone function, automatic movement, and elegant blue dial. Perfect for world travelers.',
            imageUrl: 'https://placehold.co/600x600/F9F9F7/C6A664?text=SPB221J1',
            price: 749.00,
            stock: 3,
            category: 'Automatic',
            features: [
                'Automatic 6R64 GMT movement',
                'Dual time zone',
                'Sapphire crystal',
                '100m water resistance',
                'Date display'
            ],
            isFeatured: true,
            createdAt: timestamp,
            updatedAt: timestamp,
        },
        {
            name: 'Seiko 5 Sports "SRPD"',
            brand: 'Seiko',
            reference: 'SRPD51K1',
            description: 'Classic dive-style sports watch with automatic movement. 100m water resistance, luminous markers, and day-date display. Excellent value proposition.',
            imageUrl: 'https://placehold.co/600x600/F9F9F7/C6A664?text=SRPD51K1',
            price: 249.00,
            stock: 15,
            category: 'Sports',
            features: [
                'Automatic 4R36 movement',
                '100m water resistance',
                'Day-date display',
                'Luminous hands',
                'Rotating bezel'
            ],
            isFeatured: false,
            createdAt: timestamp,
            updatedAt: timestamp,
        },
        {
            name: 'Seiko Presage "Cocktail Time Mockingbird"',
            brand: 'Seiko',
            reference: 'SRPE47J1',
            description: 'Elegant dress watch with white textured dial reminiscent of cocktail culture. Automatic movement with power reserve indicator and exhibition caseback.',
            imageUrl: 'https://placehold.co/600x600/F9F9F7/C6A664?text=SRPE47J1',
            price: 499.00,
            stock: 6,
            category: 'Dress',
            features: [
                'Automatic 4R57 movement',
                'Power reserve indicator',
                'Exhibition caseback',
                'Sapphire crystal',
                '50m water resistance'
            ],
            isFeatured: false,
            createdAt: timestamp,
            updatedAt: timestamp,
        },
        {
            name: 'Seiko Prospex "Save The Ocean"',
            brand: 'Seiko',
            reference: 'SRPD21K1',
            description: 'Special edition dive watch with stunning blue gradient dial. Part of Save The Ocean series. 200m water resistance and automatic movement.',
            imageUrl: 'https://placehold.co/600x600/F9F9F7/C6A664?text=SRPD21K1',
            price: 389.00,
            stock: 0,
            category: 'Diver',
            features: [
                'Automatic 4R36 movement',
                '200m water resistance',
                'Unidirectional bezel',
                'Luminous markers',
                'Save The Ocean edition'
            ],
            isFeatured: false,
            createdAt: timestamp,
            updatedAt: timestamp,
        },
        {
            name: 'Seiko 5 Sports "GMT"',
            brand: 'Seiko',
            reference: 'SSK001K1',
            description: 'Affordable GMT sports watch with dual time zone function. Perfect for travelers. 100m water resistance and day-date display.',
            imageUrl: 'https://placehold.co/600x600/F9F9F7/C6A664?text=SSK001K1',
            price: 349.00,
            stock: 2,
            category: 'Sports',
            features: [
                'Automatic 4R34 GMT movement',
                'Dual time zone',
                '100m water resistance',
                'Day-date display',
                'Hardlex crystal'
            ],
            isFeatured: false,
            createdAt: timestamp,
            updatedAt: timestamp,
        },
        {
            name: 'Seiko Presage "Style 60s"',
            brand: 'Seiko',
            reference: 'SRPG03J1',
            description: 'Retro-inspired dress watch with 60s aesthetic. Sunburst dial, automatic movement, and date display. Classic Japanese design meets modern reliability.',
            imageUrl: 'https://placehold.co/600x600/F9F9F7/C6A664?text=SRPG03J1',
            price: 429.00,
            stock: 7,
            category: 'Dress',
            features: [
                'Automatic 4R35 movement',
                'Date display',
                'Sapphire crystal',
                '50m water resistance',
                'Box-shaped crystal'
            ],
            isFeatured: false,
            createdAt: timestamp,
            updatedAt: timestamp,
        },
        {
            name: 'Seiko Prospex "Land Tortoise"',
            brand: 'Seiko',
            reference: 'SRPH11K1',
            description: 'Rugged field watch inspired by the Land Tortoise series. Compass bezel, automatic movement, and 200m water resistance. Built for adventure.',
            imageUrl: 'https://placehold.co/600x600/F9F9F7/C6A664?text=SRPH11K1',
            price: 649.00,
            stock: 4,
            category: 'Automatic',
            features: [
                'Automatic 6R35 movement',
                'Compass bezel',
                '200m water resistance',
                'Sapphire crystal',
                'Luminous markers'
            ],
            isFeatured: false,
            createdAt: timestamp,
            updatedAt: timestamp,
        }
    ];

    await db.insert(products).values(sampleProducts);
    
    console.log('✅ Products seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});