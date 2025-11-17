import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { RoleUtils } from "@/lib/role";
import { getRolePermissions } from "@/lib/settings";

// Map dashboard routes to required permissions
const routePermissionMap: Record<string, string> = {
  "/dashboard/admin/users": "view_users",
  "/dashboard/admin/settings": "manage_settings",
  "/dashboard/admin/logs": "manage_settings", 
  "/dashboard/admin/breaks": "manage_settings", 
  "/dashboard/admin/permissions": "manage_settings", 
};

// Map API routes to required permissions
const apiPermissionMap: Record<string, string> = {
  "/api/admin/vacation": "manage_all_vacation",
  "/api/admin/stats": "view_all_reports",
  "/api/admin/export": "export_reports",
  "/api/admin/time-entries": "view_all_time",
  "/api/admin/users": "view_users",
  "/api/admin/settings": "manage_settings",
  "/api/admin/logs": "manage_settings",
  "/api/admin/break-settings": "manage_settings",
  "/api/admin/permissions": "manage_settings",
};

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
      
      // Check if the route requires a specific permission
      let hasRequiredPermission = false;
      
      for (const [route, permission] of Object.entries(routePermissionMap)) {
        if (pathname.startsWith(route)) {
          try {
            const rolePermissions = await getRolePermissions();
            const userPermissions = rolePermissions[userRole] || [];
            hasRequiredPermission = userPermissions.includes(permission);
            
            if (!hasRequiredPermission) {
              console.warn(`[Middleware] Permission denied: ${permission} required for ${pathname}, role: ${userRole}`);
              return NextResponse.redirect(new URL("/dashboard?error=unauthorized", request.url));
            }
          } catch (error) {
            console.error("[Middleware] Error checking permissions:", error);
            // Fallback to role-based check if permission system fails
            if (!RoleUtils.isAdmin(userRole)) {
              return NextResponse.redirect(new URL("/dashboard?error=unauthorized", request.url));
            }
          }
          break;
        }
      }
      
      // For other admin pages without specific permission requirements, require at least manager access
      if (!hasRequiredPermission && !RoleUtils.hasManagerAccess(userRole)) {
        console.warn(`[Middleware] Access denied to ${pathname} for role: ${userRole}`);
        return NextResponse.redirect(new URL("/dashboard?error=unauthorized", request.url));
      }
    }
  }

  // Admin API routes - require permission based on endpoint
  if (pathname.startsWith("/api/admin")) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = token.role as string;

    // Check if the route requires a specific permission
    let hasRequiredPermission = false;
    
    for (const [route, permission] of Object.entries(apiPermissionMap)) {
      if (pathname.includes(route.replace("/api/admin/", ""))) {
        try {
          const rolePermissions = await getRolePermissions();
          const userPermissions = rolePermissions[userRole] || [];
          hasRequiredPermission = userPermissions.includes(permission);
          
          if (!hasRequiredPermission) {
            console.warn(`[Middleware] API permission denied: ${permission} required for ${pathname}, role: ${userRole}`);
            return NextResponse.json(
              { error: "Insufficient permissions" },
              { status: 403 }
            );
          }
        } catch (error) {
          console.error("[Middleware] Error checking API permissions:", error);
          // Fallback to admin check if permission system fails
          if (!RoleUtils.isAdmin(userRole)) {
            return NextResponse.json(
              { error: "Admin access required" },
              { status: 403 }
            );
          }
        }
        break;
      }
    }
    
    // For any other admin API endpoints not in the map, require admin role
    if (!hasRequiredPermission && !RoleUtils.isAdmin(userRole)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }
  }

  // Root page redirect - check if landing page is disabled
  if (pathname === "/") {
    try {
      const { getSetting } = await import("@/lib/settings");
      const disableLanding = await getSetting<boolean>("disable_landing_page");
      if (disableLanding) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
    } catch (error) {
      console.error("[Middleware] Error checking landing page setting:", error);
    }
  }

  // Login redirect - check if auto redirect is enabled
  if (pathname === "/login") {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (token) {
      try {
        const { getSetting } = await import("@/lib/settings");
        const autoRedirect = await getSetting<boolean>("auto_redirect_from_login");
        if (autoRedirect) {
          return NextResponse.redirect(new URL("/dashboard", request.url));
        }
      } catch (error) {
        console.error("[Middleware] Error checking auto redirect setting:", error);
      }
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
