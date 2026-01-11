import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function hasAuthCookie(req: NextRequest) {
  // Adjust names if yours differ — these are common for Supabase cookie auth setups.
  const names = [
    "sb-access-token",
    "sb-refresh-token",
    "sb:token",
    "supabase-auth-token",
    "sb-mumalwdczrmxvbenqmgh-auth-token", // (example) if you used project-scoped cookie
  ];

  return names.some((n) => !!req.cookies.get(n)?.value);
}

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // ✅ PUBLIC ALWAYS
  if (
    pathname === "/" ||
    pathname.startsWith("/auth") ||
    pathname === "/login" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/public")
  ) {
    return NextResponse.next();
  }

  // ✅ PRIVATE: ONLY guard /client (and subroutes)
  if (pathname === "/client" || pathname.startsWith("/client/")) {
    if (hasAuthCookie(req)) return NextResponse.next();

    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  // ✅ everything else is public by default
  return NextResponse.next();
}

// ✅ IMPORTANT: only run this proxy for /client routes
export const config = {
  matcher: ["/client/:path*"],
};
