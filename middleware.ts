import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Excluir rutas estáticas y API de autenticación
  const isPublicRoute = 
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname === "/sitemap.xml" ||
    pathname.startsWith("/premium.pdf");

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Obtener sesión
  const session = await auth.api.getSession({ headers: await headers() });
  
  // Preparar respuesta con headers de seguridad
  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  
  // Proteger /mi-cuenta: Redirigir a login si no hay sesión
  if (pathname.startsWith("/mi-cuenta")) {
    if (!session?.user) {
      const url = new URL("/iniciar-sesion", request.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return response;
  }
  
  // Redirigir de /iniciar-sesion y /registrarse a /mi-cuenta si ya hay sesión
  if (pathname === "/iniciar-sesion" || pathname === "/registrarse") {
    if (session?.user) {
      const callbackURL = request.nextUrl.searchParams.get("next") || "/mi-cuenta";
      return NextResponse.redirect(new URL(callbackURL, request.url));
    }
  }
  
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|premium.pdf).*)",
  ],
};