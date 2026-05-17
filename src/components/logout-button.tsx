"use client";

import { Button } from "./ui/button";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export function LogOutToggle() {
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
