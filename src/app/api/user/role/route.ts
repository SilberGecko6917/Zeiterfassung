import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getUserRole } from "@/lib/server/user-service";
import { authOptions } from "@/lib/auth";
import { Role } from "@/lib/constants";

function genResponse(role: Role | null) {
  return NextResponse.json({
    role: role,
    isAdmin: role !== null && role !== undefined ? role == Role.ADMIN : false,
    isManager:
      role !== null && role !== undefined ? role === Role.MANAGER : false,
  });
}

/**
 * Checks if the given role is a real role
 */
function strToRole(role: string | null): Role | null {
  if (!role) {
    return null;
  }

  const normalizedRole = role.toLowerCase();
  if (normalizedRole === "admin") return Role.ADMIN;
  if (normalizedRole === "manager") return Role.MANAGER;
  if (normalizedRole === "user") return Role.EMPLOYEE;

  return null;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ isAdmin: false }, { status: 401 });
    }

    const role = await getUserRole(session.user.id);
    const roleEnum = strToRole(role);

    if (roleEnum === null) {
      return genResponse(null);
    }

    return genResponse(roleEnum);
  } catch (error) {
    console.error("Error checking role:", error);
    return NextResponse.json(
      { error: "Failed to check role" },
      { status: 500 }
    );
  }
}
