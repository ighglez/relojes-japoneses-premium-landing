import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { downloads, referrals } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

// Anti-abuse: 2 hour window
const ABUSE_WINDOW = 2 * 60 * 60 * 1000;

function hashIPUA(ip: string, ua: string): string {
  return crypto.createHash("sha256").update(ip + ua).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refCode } = body;

    // Get IP and UA
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const ua = request.headers.get("user-agent") || "unknown";
    const ipHash = hashIPUA(ip, ua);
    const uaSnippet = ua.substring(0, 100);

    // Check for abuse (same IP+UA within 2 hours)
    const recentDownloads = await db
      .select()
      .from(downloads)
      .where(eq(downloads.ipHash, ipHash))
      .limit(1);

    if (recentDownloads.length > 0) {
      const lastDownload = new Date(recentDownloads[0].ts).getTime();
      const now = Date.now();
      if (now - lastDownload < ABUSE_WINDOW) {
        return NextResponse.json(
          { message: "Download already tracked recently" },
          { status: 200 }
        );
      }
    }

    // Insert download
    await db.insert(downloads).values({
      ts: new Date().toISOString(),
      refCode: refCode || null,
      ipHash,
      uaSnippet,
    });

    // If refCode exists, increment referral count
    if (refCode) {
      const referral = await db
        .select()
        .from(referrals)
        .where(eq(referrals.refCode, refCode))
        .limit(1);

      if (referral.length > 0) {
        await db
          .update(referrals)
          .set({ totalCount: referral[0].totalCount + 1 })
          .where(eq(referrals.refCode, refCode));
      }
    }

    return NextResponse.json({ message: "Download tracked" }, { status: 200 });
  } catch (error) {
    console.error("Error tracking download:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
