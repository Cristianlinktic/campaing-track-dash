import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

// Protege todas las rutas salvo /login, los endpoints de auth y los estáticos.
// Usa solo `jose` (edge-safe) para verificar el JWT de sesión.

const PUBLIC_PATHS = ["/login", "/api/auth/login"];
// Solo accesibles por admin; el lector es redirigido al inicio.
const ADMIN_PATHS = ["/importar", "/configuracion"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);

  // Usuario autenticado intentando ver /login → al dashboard.
  if (session && pathname === "/login") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (isPublic) return NextResponse.next();

  // Sin sesión → login (guardando destino).
  if (!session) {
    const url = new URL("/login", req.url);
    if (pathname !== "/") url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Lector intenta acceder a rutas de admin → redirige al inicio.
  const isAdminRoute = ADMIN_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (isAdminRoute && session.role !== "admin") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  // Excluye estáticos de Next y archivos con extensión.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
