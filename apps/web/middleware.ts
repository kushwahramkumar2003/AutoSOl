import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import configs from "./config";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: configs.nextAuthSecret });
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

  if (token) {
    return NextResponse.next();
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
