import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  
  // Add security headers
  const response = NextResponse.next();
  
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  
  // Check authentication for protected routes
  if (request.nextUrl.pathname.startsWith("/mi-cuenta")) {
    if (!session?.user) {
      return NextResponse.redirect(new URL("/iniciar-sesion", request.url));
    }
  }
  
  return response;
}

export const config = {
  matcher: ["/mi-cuenta/:path*", "/((?!api|_next/static|_next/image|favicon.ico).*)"],
};