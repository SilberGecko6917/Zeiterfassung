"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getTimezoneDisplayName } from "@/lib/timezone-client";
import { SUPPORTED_TIMEZONES } from "@/lib/timezone";

export function TimezoneSettings() {
  const [timezone, setTimezone] = useState<string>("UTC");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchTimezone = useCallback(async () => {
    try {
      const response = await fetch("/api/user/timezone");
      if (response.ok) {
        const data = await response.json();
        setTimezone(data.timezone || "UTC");
      }
    } catch (error) {
      console.error("Error fetching timezone:", error);
      toast.error("Failed to load timezone setting");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTimezone();
  }, [fetchTimezone]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/user/timezone", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ timezone }),
      });

      if (response.ok) {
        toast.success("Zeitzone erfolgreich aktualisiert");
        await fetchTimezone();
      } else {
        const error = await response.json();
        toast.error(error.error || "Fehler beim Aktualisieren der Zeitzone");
      }
    } catch (error) {
      console.error("Error updating timezone:", error);
      toast.error("Fehler beim Aktualisieren der Zeitzone");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Zeitzoneneinstellungen</CardTitle>
          <CardDescription>Laden der Einstellungen...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Zeitzoneneinstellungen</CardTitle>
        <CardDescription>
          Stellen Sie Ihre Zeitzone ein, um sicherzustellen, dass Zeiten korrekt angezeigt werden. Alle Zeiten werden intern in UTC gespeichert.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="timezone">Ihre Zeitzone</Label>
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger id="timezone">
              <SelectValue placeholder="Zeitzone auswählen" />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_TIMEZONES.map((tz) => (
                <SelectItem key={tz} value={tz}>
                  {getTimezoneDisplayName(tz)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Aktuell: {getTimezoneDisplayName(timezone)}
          </p>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Speichern..." : "Zeitzone speichern"}
        </Button>
      </CardContent>
    </Card>
  );
}
