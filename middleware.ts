import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Oasis Portal — Enterprise Auth Gate (NON-BLOCKING / SAFE)
 * - Public launchpad stays public.
 * - Auth surfaces stay public (callback + set-password).
 * - Only protected routes require a valid Supabase cookie session.
 * - Cookie refresh is supported (setAll writes to response).
 */

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/auth/callback",
  "/auth/set-password",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
];

const PUBLIC_PREFIXES = ["/auth"];
const ASSET_PREFIXES = ["/_next", "/assets"];

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) return true;
  if (ASSET_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublicPath(pathname)) return NextResponse.next();

  const res = NextResponse.next({ request: { headers: req.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    }
  );

  // ✅ Cookie-truth: if session exists, allow. If not, redirect.
  const { data } = await supabase.auth.getSession();
  const session = data.session;

  if (!session?.user) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
