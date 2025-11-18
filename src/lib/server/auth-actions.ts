"use server";

import { getServerSession } from "next-auth";
import { prisma } from "../prisma";
import { authOptions } from "../auth";
import { headers } from "next/headers";
import { hasPermission as settingsHasPermission } from "../settings";

/**
 * Gets the current session with user information
 * @returns Session object or null
 */
export async function getSession() {
  return await getServerSession(authOptions);
}

/**
 * Checks if a user has a specific permission based on their role and settings
 * @param permissionId The permission ID to check (from settings)
 * @returns True if the user has the permission, false otherwise
 */
export async function checkPermission(permissionId: string): Promise<boolean> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || !session?.user?.role) {
      return false;
    }

    // Use the settings-based permission check
    return await settingsHasPermission(session.user.role, permissionId);
  } catch (error) {
    console.error("Error checking permission:", error);
    return false;
  }
}

/**
 * Checks if the current user has admin privileges
 * @returns True if the user is an admin, false otherwise
 */
export async function checkIsAdmin(): Promise<boolean> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return false;
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user) {
      return false;
    }

    return user.role === "ADMIN";
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

/**
 * Checks if the current user has manager privileges (managers or admins)
 * @returns True if the user is a manager or admin, false otherwise
 */
export async function checkIsManager(): Promise<boolean> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return false;
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user) {
      return false;
    }

    return user.role === "ADMIN" || user.role === "MANAGER";
  } catch (error) {
    console.error("Error checking manager status:", error);
    return false;
  }
}

/**
 * Gets the role of the currently logged in user
 * @returns The user's role or null if no user is logged in
 */
export async function getCurrentUserRole(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    return user?.role || null;
  } catch (error) {
    console.error("Error getting current user role:", error);
    return null;
  }
}

/**
 * Gets the IP address of the current request
 * @returns IP address string
 */
export async function IP() {
  const FALLBACK_IP_ADDRESS = "0.0.0.0";
  const forwardedFor = (await headers()).get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0] ?? FALLBACK_IP_ADDRESS;
  }

  return (await headers()).get("x-real-ip") ?? FALLBACK_IP_ADDRESS;
}
