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
  const pathname = req.nextUrl.pathname;

  // Allow invitation pages without authentication
  const isInvitationPage = pathname.startsWith('/accept-org') || pathname.startsWith('/accept-invite');
  const isPublicPage = ["/login", "/signup"].includes(pathname);

  // Not logged in → force /login (except for public pages and invitation pages)
  if (!token && !isPublicPage && !isInvitationPage) {
    console.log('🔒 Middleware: Redirecting to login -', pathname);
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Already logged in & hit /dashboard → send into your org
  if (token && pathname === "/dashboard") {
    const orgId = getOrgFromToken(token);
    const dest = orgId ? `/dashboard/${orgId}` : "/dashboard";
    console.log('🏠 Middleware: Redirecting to org dashboard -', dest);
    return NextResponse.redirect(new URL(dest, req.url));
  }

  // Prevent logged‐in users from visiting /login or /signup
  if (token && isPublicPage) {
    const orgId = getOrgFromToken(token);
    const dest = orgId ? `/dashboard/${orgId}` : "/dashboard";
    console.log('🔒 Middleware: Already logged in, redirecting to dashboard -', dest);
    return NextResponse.redirect(new URL(dest, req.url));
  }

  console.log('✅ Middleware: Allowing access to -', pathname);
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
