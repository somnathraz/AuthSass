// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";

function getOrgFromToken(token: string): string | undefined {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("⚠️ JWT_SECRET is not set");
    return undefined;
  }

  try {
    // jwt.verify returns string | JwtPayload, so we narrow to JwtPayload:
    const decoded = jwt.verify(token, secret) as JwtPayload & {
      orgId?: string;
    };
    return decoded.orgId;
  } catch (err) {
    console.error("JWT verification failed:", err);
    return undefined;
  }
}

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;

  // Not logged in → force /login
  if (!token && !["/login", "/signup"].includes(req.nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Already logged in & hit /dashboard → send into your org
  if (token) {
    const orgId = getOrgFromToken(token);
    const dest = orgId ? `/dashboard/${orgId}` : "/dashboard";
    return NextResponse.redirect(new URL(dest, req.url));
  }

  // Prevent logged‐in users from visiting /login or /signup
  if (token && ["/login", "/signup"].includes(req.nextUrl.pathname)) {
    const orgId = getOrgFromToken(token);
    const dest = orgId ? `/dashboard/${orgId}` : "/dashboard";
    return NextResponse.redirect(new URL(dest, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
