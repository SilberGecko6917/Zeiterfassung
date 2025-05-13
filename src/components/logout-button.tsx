"use client";

import { Button } from "./ui/button";
import { LogIn, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";

export function LogOutToggle() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="w-9 h-9 opacity-0">
        <LogIn className="h-4 w-4" />
        <span className="sr-only">Logout</span>
      </Button>
    );
  }
  return (
    <Button
      variant="ghost"
      size="icon"
      className="w-9 h-9"
      onClick={() => {
        signOut();
      }}
    >
      <LogOut className="h-4 w-4" />
      <span className="sr-only">Logout</span>
    </Button>
  );
}
