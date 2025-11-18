"use client";

import { RoleUtils } from "@/lib/role";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "@/components/admin/AdminSidebar";
import { toast } from "sonner";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    // Check authentication
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    // Check admin or manager role (middleware already checked, but double-check for UX)
    if (status === "authenticated") {
      const hasAccess = RoleUtils.hasManagerAccess(session?.user?.role);
      
      if (!hasAccess) {
        toast.error("Zugriff verweigert. Admin- oder Manager-Berechtigung erforderlich.");
        router.push("/dashboard");
      }
    }
  }, [router, status, session]);

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

  // Don't render admin content if not admin or manager (middleware will redirect)
  if (!RoleUtils.hasManagerAccess(session?.user?.role)) {
    return null;
  }

  return (
    <div className="flex bg-muted/30 w-full h-full">
      <div className="flex flex-col md:w-64 bg-background border-r border-border">
        <Sidebar />
      </div>
      <main className="flex-1 w-full mt-20 md:m-5 min-h-screen">
        <div className="pt-16 md:pt-5">{children}</div>
      </main>
    </div>
  );
}