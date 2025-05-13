import { clsx, type ClassValue } from "clsx";
import { Session } from "next-auth";
import { twMerge } from "tailwind-merge";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function checkAdminAccess(
  session: Session | null,
  status: "authenticated" | "unauthenticated" | "loading",
  router: AppRouterInstance
): Promise<boolean> {
  if (status === "unauthenticated") {
    router.push("/login");
    return false;
  }

  if (status === "authenticated" && session?.user?.id) {
    try {
      const response = await fetch("/api/user/role");
      if (!response.ok) {
        throw new Error("Failed to fetch user role");
      }

      const data = await response.json();
      if (!data.isAdmin) {
        router.push("/dashboard");
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error checking admin access:", error);
      router.push("/dashboard");
      return false;
    }
  }

  return false;
}
