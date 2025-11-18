"use client";

import { useSession } from "next-auth/react";
import { useMemo } from "react";
import { RoleUtils } from "@/lib/role";

export function useNavAccess() {
  const { data: session, status } = useSession();
  const loading = status === "loading";

  const adminAccess = useMemo(() => {
    return RoleUtils.isAdmin(session?.user?.role);
  }, [session?.user?.role]);

  const managerAccess = useMemo(() => {
    return RoleUtils.hasManagerAccess(session?.user?.role);
  }, [session?.user?.role]);

  return {
    adminAccess,
    managerAccess,
    loading,
    session,
    role: session?.user?.role,
  };
}
