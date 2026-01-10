import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Publicly accessible routes (NO auth required)
 * These MUST remain open or Supabase auth breaks.
 */
const PUBLIC_PATHS = [
  "/login",
  "/auth/callback",
  "/auth/set-password",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
];

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;

  // Allow auth subpaths (important for Supabase redirects)
  if (pathname.startsWith("/auth/")) return true;

  // Allow Next internals & static assets
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/assets")) return true;

  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ✅ Allow public routes immediately
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  /**
   * IMPORTANT:
   * We must create the response FIRST so Supabase
   * can attach refreshed auth cookies to it.
   */
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  /**
   * CRITICAL:
   * getUser() triggers session refresh if needed.
   * If middleware blocks before this completes,
   * login appears to "do nothing".
   */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 🚫 Not authenticated → redirect to login
  if (!user) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/login";

    // Preserve intended destination
    redirectUrl.searchParams.set("next", pathname);

    return NextResponse.redirect(redirectUrl);
  }

  // ✅ Authenticated → allow request WITH cookies attached
  return res;
}

export const config = {
  matcher: [
    // Run on all routes except static assets
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
