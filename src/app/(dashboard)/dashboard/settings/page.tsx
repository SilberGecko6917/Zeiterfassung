"use client";

import { Button } from "@/components/ui/button";
import { TimezoneSettings } from "@/components/TimezoneSettings";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function UserSettingsPage() {
  const router = useRouter();
  
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück
          </Button>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Benutzereinstellungen</h1>
        <p className="text-muted-foreground mt-2">
          Verwalten Sie Ihre persönlichen Einstellungen
        </p>
      </div>

      <div className="grid gap-6">
        <TimezoneSettings />
      </div>
    </div>
  );
}
