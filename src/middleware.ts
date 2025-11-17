import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { RoleUtils } from "@/lib/role";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const installCookie = request.cookies.get("installation-complete")?.value;
  const isInstalledFromCookie = installCookie === "true";

  // Installation routes
  if (pathname.startsWith("/install") || pathname.startsWith("/api/install")) {
    if (isInstalledFromCookie) {
      return new Response("Already installed", { status: 403 });
    }
    return NextResponse.next();
  }

  // Dashboard routes - require authentication
  if (pathname.startsWith("/dashboard")) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Admin routes - require admin or manager role
    if (pathname.startsWith("/dashboard/admin")) {
      const userRole = token.role as string;
      
      if (!RoleUtils.hasManagerAccess(userRole)) {
        console.warn(`[Middleware] Access denied to ${pathname} for role: ${userRole}`);
        return NextResponse.redirect(new URL("/dashboard?error=unauthorized", request.url));
      }
    }
  }

  // Admin API routes - require admin or manager role based on endpoint
  if (pathname.startsWith("/api/admin")) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = token.role as string;

    // Managers can access these endpoints
    const managerAllowedPaths = [
      "/api/admin/vacation",
      "/api/admin/stats",
      "/api/admin/export",
      "/api/admin/time-entries"
    ];

    const isManagerAllowed = managerAllowedPaths.some(path => pathname.includes(path));

    if (isManagerAllowed) {
      if (!RoleUtils.hasManagerAccess(userRole)) {
        return NextResponse.json(
          { error: "Insufficient permissions" },
          { status: 403 }
        );
      }
    }
    // Admin-only endpoints (users, settings, logs, break-settings, permissions)
    else if (!RoleUtils.isAdmin(userRole)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }
  }

  // Root page redirect
  if (pathname === "/" && process.env.NEXT_PUBLIC_REMOVE_LANDING === "True") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Login redirect
  if (pathname === "/login") {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (token && process.env.NEXT_PUBLIC_LOGIN_REDIRECT === "True") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/api/admin/:path*",
    "/api/install/:path*",
    "/install/:path*",
    "/login",
  ],
};
