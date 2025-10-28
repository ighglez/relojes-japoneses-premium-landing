import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer } from "better-auth/plugins";
import { NextRequest } from 'next/server';
import { headers } from "next/headers"
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

// Enhanced base URL detection for production and custom domains
const getBaseURL = () => {
  // Client-side
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // Server-side - priority order for production
  // 1. Explicit site URL (set this in Vercel with your custom domain)
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  }
  
  // 2. NextAuth URL
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL.replace(/\/$/, '');
  }
  
  // 3. Vercel URL (automatic in Vercel deployments)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // 4. Check for custom domain via headers (best for production)
  try {
    const headersList = headers();
    const host = headersList.get('host');
    const protocol = headersList.get('x-forwarded-proto') || 'https';
    if (host && !host.includes('localhost')) {
      return `${protocol}://${host}`;
    }
  } catch (e) {
    // Headers not available
  }
  
  // 5. Fallback to localhost
  return 'http://localhost:3000';
};
 
export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "sqlite",
	}),
	baseURL: getBaseURL(),
	secret: process.env.BETTER_AUTH_SECRET || process.env.NEXTAUTH_SECRET,
	emailAndPassword: {    
		enabled: true,
		autoSignIn: true,
		requireEmailVerification: false,
		sendResetPassword: async ({ user, url }) => {
			// Email sending will be implemented when needed
			console.log(`Password reset for ${user.email}: ${url}`);
		},
		async sendVerificationEmail({ user, url }) {
			// Email verification will be implemented when needed
			console.log(`Email verification for ${user.email}: ${url}`);
		},
	},
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID || "",
			clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
			redirectURI: `${getBaseURL()}/api/auth/callback/google`,
		},
	},
	session: {
		expiresIn: 60 * 60 * 24 * 30, // 30 days for better persistence
		updateAge: 60 * 60 * 24, // 1 day
		cookieName: "iwatches_session",
	},
	advanced: {
		cookiePrefix: "iwatches",
		crossSubDomainCookies: {
			enabled: true,
		},
		useSecureCookies: process.env.NODE_ENV === "production",
		generateId: () => {
			// Generate cryptographically secure IDs
			return crypto.randomUUID();
		},
	},
	plugins: [
		bearer()
	],
	trustedOrigins: process.env.NODE_ENV === "production" 
		? [getBaseURL()] 
		: ["http://localhost:3000"],
	// Runtime debe ser Node.js (no Edge)
	runtimeEnv: "node",
});

// Helper to validate unique email before registration
export async function checkEmailExists(email: string): Promise<boolean> {
	try {
		const existingUser = await db.select().from(user).where(eq(user.email, email.toLowerCase())).limit(1);
		return existingUser.length > 0;
	} catch (error) {
		console.error("Error checking email:", error);
		return false;
	}
}

// Session validation helper
export async function getCurrentUser(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    return session?.user || null;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

// Server-side session helper for pages
export async function getServerSession() {
	try {
		const session = await auth.api.getSession({ headers: await headers() });
		return session;
	} catch (error) {
		console.error("Error getting server session:", error);
		return null;
	}
}