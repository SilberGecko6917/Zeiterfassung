"use client";

import { AdminButton } from "@/components/admin-button";
import { LogOutToggle } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { checkIsAdmin } from "@/lib/server/auth-actions";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.name) {
      toast.success(`Willkommen zurück, ${session.user.name}!`);
    }
  }, [session?.user?.name]);

  useEffect(() => {
    const verifyAccess = async () => {
      if (status === "authenticated") {
        try {
          const isAdminResult = await checkIsAdmin();

          setIsAdmin(isAdminResult);
        } catch (error) {
          console.error("Error checking admin access:", error);
        }
      }
    };

    if (status !== "loading") {
      verifyAccess();
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full" />
          <p className="text-muted-foreground">Dashboard wird Geladen...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated" && !session) {
    toast.error("Bitte melde dich an, um auf das Dashboard zuzugreifen.");
    return null;
  }
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="absolute top-4 right-4">
        {isAdmin && !window.location.pathname.includes("/admin") && (
          <AdminButton />
        )}
        <LogOutToggle />
        <ThemeToggle />
      </div>
      {children}
    </div>
  );
}
