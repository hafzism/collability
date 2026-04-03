import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { AUTH_COOKIE_NAME } from "@/lib/auth";

const protectedRoutes = new Set(["/dashboard"]);
const guestOnlyRoutes = new Set(["/", "/login", "/signup"]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasAuthCookie = Boolean(request.cookies.get(AUTH_COOKIE_NAME)?.value);

  if (!hasAuthCookie && protectedRoutes.has(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (hasAuthCookie && guestOnlyRoutes.has(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/signup", "/dashboard"],
};
