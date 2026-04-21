import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // SEC-002: Only explicitly listed routes are public.
  // The previous blanket /api/.* exemption has been removed — API routes
  // now require auth unless they match one of the patterns below.
  const publicRoutePatterns = [
    /^\/$/, // landing page
    /^\/auth$/, // sign-in page
    /^\/apology\/[^/]+$/, // error pages
    /^\/api\/auth\/.*/, // next-auth internals (signin, callback, session…)
    /^\/api\/auth\/challenge$/, // nonce challenge endpoint — must stay public
    /^\/_next\/static\/.*/, // Next.js static assets
  ];

  const isPublicRoute = publicRoutePatterns.some((pattern) =>
    pattern.test(pathname)
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  const nextAuthSecret = process.env.NEXTAUTH_SECRET;
  if (!nextAuthSecret) {
    // Avoid edge-runtime crashes when env is misconfigured.
    // Protected routes are redirected to /auth instead of throwing.
    const loginUrl = new URL("/auth", req.url);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const token = await getToken({ req, secret: nextAuthSecret });
    if (token) {
      return NextResponse.next();
    }
  } catch (error) {
    // Edge middleware must not throw or Vercel returns MIDDLEWARE_INVOCATION_FAILED.
    console.error("[middleware] token decode failed:", error);
  }

  const loginUrl = new URL("/auth", req.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    // Match all paths except these static files
    "/((?!_next|favicon.ico|preview.jpeg|solana-powered.svg|public).*)",
  ],
};
