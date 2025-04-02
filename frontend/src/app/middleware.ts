// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  // Read the token cookie. Make sure the cookie is set with path="/" so it's available on all routes.
  const token = req.cookies.get("token")?.value;
  console.log("Middleware token:", token);

  // If token exists and the user is trying to access /signin or /signup, redirect to "/"
  if (token && (req.nextUrl.pathname === "/signin" || req.nextUrl.pathname === "/signup")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // If token is missing on protected routes, redirect to /signin
  if (!token && req.nextUrl.pathname !== "/signin" && req.nextUrl.pathname !== "/signup") {
    return NextResponse.redirect(new URL("/signin", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
