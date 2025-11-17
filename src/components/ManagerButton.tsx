"use client";

import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import Link from "next/link";
import { useNavAccess } from "@/hooks/useNavAccess";

export default function ManagerButton() {
  const { managerAccess, loading } = useNavAccess();

  if (loading || !managerAccess) {
    return null;
  }

  return (
    <Link href="/dashboard/admin">
      <Button variant="outline" size="sm">
        <Users className="mr-2 h-4 w-4" />
        Manager Panel
      </Button>
    </Link>
  );
}
