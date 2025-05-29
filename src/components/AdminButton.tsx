"use client";

import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useNavAccess } from "@/hooks/useNavAccess";

export default function AdminButton() {
  const { adminAccess, loading } = useNavAccess();

  // Don't render anything if still loading or user doesn't have admin access
  if (loading || !adminAccess) {
    return null;
  }

  return (
    <Link href="/dashboard/admin">
      <Button variant="outline" size="sm" className="gap-2">
        <ShieldCheck className="h-4 w-4" />
        <span className="hidden md:inline">Admin</span>
      </Button>
    </Link>
  );
}
