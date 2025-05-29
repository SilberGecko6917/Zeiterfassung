import { NextRequest, NextResponse } from "next/server";
import { IP, getSession } from "@/lib/server/auth-actions";
import { LogAction, LogEntity } from "@/lib/enums";
import { prisma } from "@/lib/prisma";
import { getRolePermissions, saveRolePermissions } from "@/lib/settings";

// Critical permissions that ADMIN should always have
const criticalAdminPermissions = [
  "manage_settings",
  "edit_users",
  "create_users",
  "delete_users",
  "view_all_time",
  "edit_all_time",
  "manage_all_vacation"
];

// Define role hierarchy
const roleHierarchy = {
  "USER": 0,
  "MANAGER": 1,
  "ADMIN": 2
};

export async function GET() {
  try {
    // Check if user is admin or manager
    const session = await getSession();
    const userRole = session?.user?.role || "USER";
    
    // Only allow MANAGER or above to access permissions
    if (roleHierarchy[userRole as keyof typeof roleHierarchy] < roleHierarchy.MANAGER) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get current permissions
    const permissions = await getRolePermissions();
    
    return NextResponse.json({ permissions });
  } catch (error) {
    console.error("Error fetching permissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch permissions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getSession();
    const userRole = session?.user?.role || "USER";
    const userId = session?.user?.id || "system";
    
    // Only allow MANAGER or above to modify permissions
    if (roleHierarchy[userRole as keyof typeof roleHierarchy] < roleHierarchy.MANAGER) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get request body
    const { permissions } = await request.json();
    
    if (!permissions) {
      return NextResponse.json(
        { error: "Missing permissions data" },
        { status: 400 }
      );
    }

    // Get current permissions to compare
    const currentPermissions = await getRolePermissions();
    
    // Validate permission changes
    const userRoleLevel = roleHierarchy[userRole as keyof typeof roleHierarchy];
    
    // Only allow changes to roles below user's role level (except for ADMIN)
    const validatedPermissions = { ...currentPermissions };
    
    Object.keys(permissions).forEach(role => {
      const roleLevel = roleHierarchy[role as keyof typeof roleHierarchy];
      
      // Skip roles the user can't modify
      if (roleLevel >= userRoleLevel && userRoleLevel < roleHierarchy.ADMIN) {
        return;
      }
      
      // Update validated permissions
      validatedPermissions[role] = [...permissions[role]];
      
      // Ensure ADMIN always has critical permissions
      if (role === "ADMIN") {
        criticalAdminPermissions.forEach(permission => {
          if (!validatedPermissions[role].includes(permission)) {
            validatedPermissions[role].push(permission);
          }
        });
      }
    });

    // Save validated permissions
    await saveRolePermissions(validatedPermissions);
    
    // Log the action
    await prisma.log.create({
      data: {
        userId,
        action: LogAction.UPDATE,
        entity: LogEntity.SETTING,
        details: JSON.stringify({
          message: "Role permissions updated",
          setting: "role_permissions"
        }),
        ipAddress: await IP(),
      },
    });

    return NextResponse.json({ 
      success: true,
      permissions: validatedPermissions 
    });
  } catch (error) {
    console.error("Error updating permissions:", error);
    return NextResponse.json(
      { error: "Failed to update permissions" },
      { status: 500 }
    );
  }
}