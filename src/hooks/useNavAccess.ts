"use client";

import { useSession } from "next-auth/react";
import { useMemo } from "react";

export function useNavAccess() {
  const { data: session, status } = useSession();
  const loading = status === "loading";

  const adminAccess = useMemo(() => {
    if (!session?.user) return false;
    return session.user.role === "ADMIN";
  }, [session]);

  return {
    adminAccess,
    loading,
    session,
  };
}
