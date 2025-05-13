"use client";

import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { useEffect, useState } from "react";

export function AdminButton() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="w-9 h-9 opacity-0">
        <Shield className="h-4 w-4" />
        <span className="sr-only">Admin Dashboard</span>
      </Button>
    );
  }
  return (
    <Button
      variant="ghost"
      size="icon"
      className="w-9 h-9"
      onClick={() => {
        window.location.href = "dashboard/admin";
      }}
    >
      <Shield className="h-4 w-4" />
      <span className="sr-only">Admin</span>
    </Button>
  );
}
