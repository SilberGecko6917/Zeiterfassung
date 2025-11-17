import { UserData } from "@/types/dashboard";
import { prisma } from "../prisma";

/**
 * Gets the role of a user by their ID
 * @param userId The ID of the user
 * @returns The user's role or null if the user doesn't exist
 */
export async function getUserRole(userId: string): Promise<string | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    return user?.role || null;
  } catch (error) {
    console.error("Error fetching user role:", error);
    return null;
  }
}

export async function getUserById(userId: string): Promise<UserData | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    const userData: UserData = {
      id: user?.id || "",
      name: user?.name || "",
      email: user?.email || "",
      role: (user?.role || "USER") as "USER" | "MANAGER" | "ADMIN",
      createdAt: user?.createdAt.toDateString() || "",
    };
    return userData;
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    return null;
  }
}
