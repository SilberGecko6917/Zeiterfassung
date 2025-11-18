"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Download } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User } from "@prisma/client";

export default function ExportPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Export states
  const [exportPeriod, setExportPeriod] = useState<"day" | "month" | "year">(
    "month"
  );
  const [exportUserId, setExportUserId] = useState<string>("all");
  const [exportLoading, setExportLoading] = useState(false);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/users");
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Fehler beim Laden der Benutzer");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load users on component mount
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Export Function
  const handleExport = async () => {
    try {
      setExportLoading(true);
      const userId = exportUserId !== "all" ? exportUserId : "";

      const response = await fetch(
        `/api/admin/export?period=${exportPeriod}${
          userId ? `&userId=${userId}` : ""
        }`
      );

      if (!response.ok) {
        throw new Error("Export fehlgeschlagen");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `zeiterfassung-export-${exportPeriod}-${format(
        new Date(),
        "yyyy-MM-dd"
      )}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Export erfolgreich erstellt");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Fehler beim Erstellen des Exports");
    } finally {
      setExportLoading(false);
    }
  };

  if (isLoading && users.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full" />
          <p className="text-muted-foreground">Lade Benutzerdaten...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Export</h1>
        <p className="text-muted-foreground mt-2">Arbeitszeiten exportieren</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Arbeitszeiten exportieren</CardTitle>
          <CardDescription>
            Exportieren Sie die Arbeitszeiten als Excel-Datei (.xlsx)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Zeitraum</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button
                  variant={exportPeriod === "day" ? "default" : "outline"}
                  onClick={() => setExportPeriod("day")}
                  className="w-full"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Letzter Tag
                </Button>
                <Button
                  variant={exportPeriod === "month" ? "default" : "outline"}
                  onClick={() => setExportPeriod("month")}
                  className="w-full"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Letzten 30 Tage
                </Button>
                <Button
                  variant={exportPeriod === "year" ? "default" : "outline"}
                  onClick={() => setExportPeriod("year")}
                  className="w-full"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Letztes Jahr
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Benutzer (optional)</h3>
              <Select value={exportUserId} onValueChange={setExportUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle Benutzer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Benutzer</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Wählen Sie einen bestimmten Benutzer aus oder exportieren Sie
                alle Benutzer
              </p>
            </div>
          </div>

          <div className="pt-4">
            <Button
              onClick={handleExport}
              disabled={exportLoading}
              className="w-full sm:w-auto"
            >
              {exportLoading ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full" />
                  Exportiere...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Als Excel exportieren
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
