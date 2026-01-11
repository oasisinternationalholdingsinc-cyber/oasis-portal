import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * OASIS PORTAL AUTH GATE — LOCKED
 * PUBLIC: /
 * PRIVATE: /client
 */
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Ignore Next internals & assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/robots") ||
    pathname.startsWith("/sitemap") ||
    pathname.startsWith("/assets")
  ) {
    return NextResponse.next();
  }

  // ✅ ABSOLUTE PUBLIC ROUTES
  if (
    pathname === "/" ||
    pathname.startsWith("/apply") ||
    pathname.startsWith("/public") ||
    pathname === "/login" ||
    pathname.startsWith("/auth")
  ) {
    return NextResponse.next();
  }

  // 🔒 ONLY protect /client
  const isProtected = pathname === "/client" || pathname.startsWith("/client/");
  if (!isProtected) return NextResponse.next();

  // Cookie-truth auth check (Supabase sets sb-* cookies)
  const hasSessionCookie = req.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-"));

  if (hasSessionCookie) return NextResponse.next();

  // Redirect unauthenticated users
  const login = req.nextUrl.clone();
  login.pathname = "/login";
  login.searchParams.set("next", pathname + (search || ""));
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!api).*)"],
};
