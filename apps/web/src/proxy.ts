import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { REFRESH_TOKEN_COOKIE_NAME } from "@/lib/auth-constants";

const protectedRoutes = new Set(["/dashboard"]);
const guestOnlyRoutes = new Set(["/", "/login", "/signup"]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasRefreshCookie = Boolean(
    request.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value,
  );

  if (!hasRefreshCookie && protectedRoutes.has(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (hasRefreshCookie && guestOnlyRoutes.has(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/signup", "/dashboard"],
};
