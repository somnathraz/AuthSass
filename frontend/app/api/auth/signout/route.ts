// app/api/auth/signout/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function GET(request: NextRequest) {
  // Build a redirect response to /login
  const res = NextResponse.redirect(new URL("/login", request.url));

  // Remove the cookies
  res.cookies.set("token", "", {
    path: "/",
    maxAge: -1,
  });
  res.cookies.set("refreshToken", "", {
    path: "/",
    maxAge: -1,
  });

  return res;
}
