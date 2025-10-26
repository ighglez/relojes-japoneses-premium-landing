import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { referrals } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get or create referral record
    let referral = await db
      .select()
      .from(referrals)
      .where(eq(referrals.userId, session.user.id))
      .limit(1);

    if (referral.length === 0) {
      // Create new referral record
      const refCode = nanoid(10);
      await db.insert(referrals).values({
        userId: session.user.id,
        refCode,
        totalCount: 0,
        createdAt: new Date().toISOString(),
      });

      referral = await db
        .select()
        .from(referrals)
        .where(eq(referrals.userId, session.user.id))
        .limit(1);
    }

    return NextResponse.json(referral[0], { status: 200 });
  } catch (error) {
    console.error("Error fetching referrals:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
