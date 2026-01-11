// middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Oasis Portal — Enterprise Auth Gate (NON-BLOCKING / SAFE)
 * - Public launchpad stays public.
 * - Auth surfaces stay public (callback + set-password).
 * - Only protected routes require a valid Supabase session.
 * - Cookie refresh is supported (setAll writes to response).
 * - Avoids infinite loops by:
 *    1) making /login public
 *    2) never redirecting to /login from /login
 *    3) preserving next= for return routing
 */

// Public (no auth required)
const PUBLIC_PATHS = [
  "/", // ✅ public portal launchpad must NEVER require auth
  "/login",
  "/auth/callback",
  "/auth/set-password",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
];

// Also allow any auth subroutes (defensive, future-proof)
const PUBLIC_PREFIXES = ["/auth"];

// Also allow common public assets
const ASSET_PREFIXES = ["/_next", "/assets"];

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) return true;
  if (ASSET_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ✅ Public routes are always accessible
  if (isPublicPath(pathname)) return NextResponse.next();

  // Prepare response so Supabase can set/refresh cookies
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

  // ✅ Reads the user via cookie session (server-side truth)
  const { data, error } = await supabase.auth.getUser();
  const user = data?.user ?? null;

  // ✅ If not authenticated, send them to login
  // (Preserve original destination)
  if (!user || error) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // ✅ Authenticated: allow through (and cookie refresh writes to `res`)
  return res;
}

export const config = {
  // Note: We already allow _next/assets/favicon above; matcher keeps scope broad.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
