"use server";

import { getServerSession } from "next-auth";
import { prisma } from "../prisma";
import { authOptions } from "../auth";
import { headers } from "next/headers";

/**
 * Checks if the current user has admin privileges
 * @returns True if the user is an admin, false otherwise
 */
export async function checkIsAdmin(): Promise<boolean> {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);

    // If there's no session or no user, the user is not an admin
    if (!session?.user?.id) {
      return false;
    }

    // Get the user from the database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    // If the user doesn't exist, they're not an admin
    if (!user) {
      return false;
    }

    // Check if the user's role is admin
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
    // Get the current session
    const session = await getServerSession();

    // If there's no session or no user, the user is not a manager
    if (!session?.user?.id) {
      return false;
    }

    // Get the user from the database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    // If the user doesn't exist, they're not a manager
    if (!user) {
      return false;
    }

    // Check if the user's role is admin or manager
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
    // Get the current session
    const session = await getServerSession();

    // If there's no session or no user, return null
    if (!session?.user?.id) {
      return null;
    }

    // Get the user from the database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    // Return the user's role or null if the user doesn't exist
    return user?.role || null;
  } catch (error) {
    console.error("Error getting current user role:", error);
    return null;
  }
}

export async function IP() {
  const FALLBACK_IP_ADDRESS = "0.0.0.0";
  const forwardedFor = (await headers()).get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0] ?? FALLBACK_IP_ADDRESS;
  }

  return (await headers()).get("x-real-ip") ?? FALLBACK_IP_ADDRESS;
}

export async function getSession() {
  const session = await getServerSession(authOptions);
  return session;
}
