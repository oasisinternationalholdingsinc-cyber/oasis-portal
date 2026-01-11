// middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Oasis Portal — Enterprise Auth Gate (NON-BLOCKING / SAFE)
 *
 * Guarantees:
 * - Public launchpad (/) is ALWAYS public
 * - Login, callback, set-password are ALWAYS public
 * - Only protected routes require auth
 * - No infinite redirect loops
 * - Cookie refresh supported (SSR-safe)
 * - next= destination preserved
 *
 * ❗ AUTH / SESSION WIRING IS FINAL — UI ONLY CHANGES BEYOND THIS POINT
 */

// Explicit public routes
const PUBLIC_PATHS = [
  "/", // public portal launchpad
  "/login",
  "/auth/callback",
  "/auth/set-password",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
];

// Defensive prefixes (future-proof)
const PUBLIC_PREFIXES = ["/auth"];
const ASSET_PREFIXES = ["/_next", "/assets"];

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/")))
    return true;
  if (ASSET_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ✅ Always allow public routes
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Prepare response so Supabase can refresh cookies if needed
  const res = NextResponse.next({
    request: { headers: req.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Server-side truth: cookie-backed user
  const { data, error } = await supabase.auth.getUser();
  const user = data?.user ?? null;

  // ❌ Not authenticated → redirect to login
  if (!user || error) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // ✅ Authenticated → allow through (cookies refreshed via `res`)
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
