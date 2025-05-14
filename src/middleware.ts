import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const installCookie = request.cookies.get("installation-complete")?.value;
  const isInstalledFromCookie = installCookie === "true";

  if (pathname.startsWith("/install") || pathname.startsWith("/api/install")) {
    if (isInstalledFromCookie) {
      return new Response("Already installed", { status: 403 });
    }

    return NextResponse.next();
  }

  if (pathname.startsWith("/dashboard") && !pathname.startsWith("/install")) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  if (pathname === "/" && process.env.NEXT_PUBLIC_REMOVE_LANDING === "True") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname === "/login" && process.env.NEXT_PUBLIC_LOGIN_REDIRECT === "True") {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (token) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/api/install/:path*", "/install/:path*", "/login"],
};
