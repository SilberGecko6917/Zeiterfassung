"use client";

import AdminButton from "@/components/AdminButton";
import ManagerButton from "@/components/ManagerButton";
import { LogOutToggle } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { RoleUtils } from "@/lib/role";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isAdminPage = pathname.startsWith("/dashboard/admin");

  // Check authentication
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Welcome toast
  useEffect(() => {
    if (session?.user?.name) {
      toast.success(`Willkommen zurück, ${session.user.name}!`);
    }
  }, [session?.user?.name]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full" />
          <p className="text-muted-foreground">Dashboard wird geladen...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  const isAdmin = RoleUtils.isAdmin(session?.user?.role);
  const isManager = RoleUtils.hasManagerAccess(session?.user?.role);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div
        className={`absolute top-4 right-4 flex items-center gap-2 ${
          isAdminPage ? "md:flex hidden" : ""
        }`}
      >
        {isAdmin && !isAdminPage && <AdminButton />}
        {!isAdmin && isManager && !isAdminPage && <ManagerButton />}
        <LogOutToggle />
        <ThemeToggle />
      </div>
      {children}
    </div>
  );
}
