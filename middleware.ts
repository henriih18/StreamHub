import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Rutas que no requieren autenticación
const publicRoutes = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];
const staticRoutes = ["/api/auth", "/_next", "/favicon.ico", "/images"];

// Rutas que requieren autenticación (sin verificación de email)
const protectedRoutes = [
  "/account",
  "/dashboard",
  "/profile",
  "/orders",
  "/support",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir rutas públicas y estáticas
  if (
    publicRoutes.some((route) => pathname.startsWith(route)) ||
    staticRoutes.some((route) => pathname.startsWith(route))
  ) {
    return NextResponse.next();
  }

  // Verificar token JWT
  const token =
    request.cookies.get("authToken")?.value ||
    request.headers.get("Authorization")?.replace("Bearer ", "");

  if (!token) {
    // Redirigir a login si no hay token y la ruta requiere autenticación
    if (protectedRoutes.some((route) => pathname.startsWith(route))) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("message", "auth_required");
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  try {
    // Decodificar token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
    };

    // Obtener datos del usuario desde la base de datos
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        isActive: true,
        role: true,
      },
    });

    if (!user) {
      // Usuario no encontrado - limpiar cookie y redirigir
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("authToken");
      return response;
    }

    if (!user.isActive) {
      // Usuario inactivo
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("message", "account_inactive");
      return NextResponse.redirect(loginUrl);
    }

    // Para rutas de admin, verificar rol
    if (pathname.startsWith("/admin") && user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/account", request.url));
    }

    // Agregar información del usuario a los headers para uso en las páginas
    const response = NextResponse.next();
    response.headers.set("x-user-id", user.id);
    response.headers.set("x-user-email", user.email);
    response.headers.set("x-user-role", user.role);

    return response;
  } catch (error) {
    console.error("Middleware error:", error);

    // Token inválido - limpiar cookie y redirigir
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("authToken");
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
