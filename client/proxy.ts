import { NextRequest, NextResponse } from "next/server";

const PROTECTED = ["/dashboard", "/jobs", "/applications", "/network", "/feed", "/profile", "/notifications", "/admin"];

export function proxy(req: NextRequest) {
  const hasSession = Boolean(
    req.cookies.get("accessToken")?.value || req.cookies.get("refreshToken")?.value
  );
  const { pathname } = req.nextUrl;

  if (pathname === "/" && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  const isProtected = PROTECTED.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  if (isProtected && !hasSession) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", `${pathname}${req.nextUrl.search}`);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/jobs", "/jobs/:path*", "/applications/:path*", "/network/:path*", "/feed/:path*", "/profile/:path*", "/notifications/:path*", "/admin/:path*", "/login", "/register", "/forgot-password", "/verify-email", "/reset-password"],
};
