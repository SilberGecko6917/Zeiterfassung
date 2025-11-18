"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { User, Coffee, Save, Clock } from "lucide-react";
import { User as UserType } from "@prisma/client";

interface BreakSetting {
  userId: string;
  breakDuration: number;
  autoInsert: boolean;
}

interface UserWithBreakSettings extends UserType {
  breakSettings?: BreakSetting;
}

export default function BreaksPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [usersWithBreakSettings, setUsersWithBreakSettings] = useState<
    UserWithBreakSettings[]
  >([]);

  // Fetch break settings for all users
  const fetchBreakSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/break-settings");
      const data = await response.json();
      setUsersWithBreakSettings(data.users || []);
    } catch (error) {
      console.error("Failed to fetch break settings:", error);
      toast.error("Fehler beim Laden der Pauseneinstellungen");
    } finally {
      setIsLoading(false);
    }
  };

  // Save break settings for a user
  const handleSaveBreakSettings = async (
    userId: string,
    breakDuration: number,
    autoInsert: boolean
  ) => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/break-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, breakDuration, autoInsert }),
      });

      if (!response.ok) {
        throw new Error("Failed to save break settings");
      }

      toast.success("Pauseneinstellungen gespeichert");
      fetchBreakSettings();
    } catch (error) {
      console.error("Failed to save break settings:", error);
      toast.error("Fehler beim Speichern der Pauseneinstellungen");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle automatic breaks insertion
  const handleTriggerAutoBreaks = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/time/auto-breaks", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to trigger automatic breaks");
      }

      const data = await response.json();
      toast.success(`${data.processedUsers} automatische Pausen eingefügt`);
    } catch (error) {
      console.error("Failed to trigger automatic breaks:", error);
      toast.error("Fehler beim Einfügen der automatischen Pausen");
    } finally {
      setIsLoading(false);
    }
  };

  // Load break settings on component mount
  useEffect(() => {
    fetchBreakSettings();
  }, []);

  if (isLoading && usersWithBreakSettings.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full" />
          <p className="text-muted-foreground">Lade Pauseneinstellungen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pausenverwaltung</h1>
        <p className="text-muted-foreground mt-2">
          Verwalten Sie automatische Pausen für Benutzer
        </p>
      </div>

      <div className="grid gap-6">
        {usersWithBreakSettings.map((user) => (
          <Card key={user.id} className="overflow-hidden">
            <CardHeader className="bg-muted/50 p-4">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {user.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form
                className="space-y-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const breakDuration = Number(formData.get("breakDuration"));
                  const autoInsert = formData.get("autoInsert") === "on";
                  handleSaveBreakSettings(user.id, breakDuration, autoInsert);
                }}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`breakDuration-${user.id}`}>
                      Pausendauer (Minuten)
                    </Label>
                    <Input
                      id={`breakDuration-${user.id}`}
                      name="breakDuration"
                      type="number"
                      min="0"
                      defaultValue={user.breakSettings?.breakDuration || 30}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor={`autoInsert-${user.id}`}
                      className="block mb-2"
                    >
                      Automatisch einfügen
                    </Label>
                    <div className="flex items-center space-x-2 pt-2">
                      <Switch
                        id={`autoInsert-${user.id}`}
                        name="autoInsert"
                        defaultChecked={
                          user.breakSettings?.autoInsert !== false
                        }
                      />
                      <Label htmlFor={`autoInsert-${user.id}`}>Aktiviert</Label>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Speichern
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Automatische Pausen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Die automatischen Pausen werden genau in der Mitte der Arbeitszeit
            eines Benutzers eingefügt. Die Pausenzeit wird so berechnet, dass
            der Mittelpunkt der Pause genau in der Mitte zwischen dem ersten und
            letzten Eintrag des Tages liegt. Dies geschieht normalerweise
            automatisch am Ende des Tages für alle Benutzer mit aktivierten
            automatischen Pausen.
          </p>

          <Button
            variant="outline"
            onClick={handleTriggerAutoBreaks}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full" />
                Wird verarbeitet...
              </>
            ) : (
              <>
                <Coffee className="mr-2 h-4 w-4" />
                Automatische Pausen jetzt einfügen
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
