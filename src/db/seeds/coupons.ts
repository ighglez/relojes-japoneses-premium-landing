import { db } from '@/db';
import { coupons } from '@/db/schema';

async function main() {
    const sampleCoupons = [
        {
            code: 'WELCOME5',
            type: 'percentage',
            value: 5.0,
            minPurchase: 100.0,
            startDate: new Date().toISOString(),
            endDate: null,
            active: true,
            oneTimePerUser: true,
            maxUses: null,
            currentUses: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }
    ];

    await db.insert(coupons).values(sampleCoupons);
    
    console.log('✅ Coupons seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});