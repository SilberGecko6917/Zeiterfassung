"use client";

import { checkIsAdmin } from "@/lib/server/auth-actions";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/admin/AdminSidebar";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [isLoading, setIsLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

    useEffect(() => {
        const verifyAccess = async () => {

            // Check if the user is authenticated
            if (status === "unauthenticated") {
                router.push("/login");
                return;
            } else if (status === "authenticated") {
                try {
                    const isAdminResult = await checkIsAdmin();

                    // Redirect to dashboard if not an admin
                    if (!isAdminResult) {
                        router.push("/dashboard");
                    }

                    setIsAdmin(isAdminResult);
                    setIsLoading(false);
                } catch (error) {
                    console.error("Error checking admin access:", error);
                    router.push("/dashboard");
                }
            }
        };

        if (status !== "loading") {
            verifyAccess();
        }
    }, [router, status]);

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

    return (
        <div className="flex bg-muted/30 w-full h-full">
            <div className="flex flex-col md:w-64 bg-background border-r border-border">
                <Sidebar />
            </div>
            <main className="flex-1 w-full mt-20 md:m-5 min-h-screen">
                <div className="pt-16 md:pt-5">
                    {children}
                </div>
            </main>
        </div>
    );
}