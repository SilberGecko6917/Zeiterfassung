"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Info } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface LogEntry {
  id: string;
  date: string;
  userId: string;
  user?: {
    name: string;
    role: string;
  };
  action: string;
  entity?: string;
  entityId?: string;
  details?: string | object;
  ipAddress?: string;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [logDetailsOpen, setLogDetailsOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  // Fetch logs
  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/logs?days=7&formated=true");

      if (!response.ok) {
        throw new Error("Failed to fetch logs");
      }

      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
      toast.error("Fehler beim Laden der Logs");
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load logs on component mount
  useEffect(() => {
    fetchLogs();
  }, []);

  const handleViewLogDetails = (log: LogEntry) => {
    setSelectedLog(log);
    setLogDetailsOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full" />
          <p className="text-muted-foreground">Lade Logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Logs</h1>
        <p className="text-muted-foreground mt-2">
          Aktionsprotokoll der letzten 7 Tage
        </p>
      </div>

      <Card className="shadow-sm border-muted">
        <CardContent className="p-0">
          {logs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/40">
                    <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                      Datum
                    </th>
                    <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                      Benutzer
                    </th>
                    <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                      Aktion
                    </th>
                    <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground hidden md:table-cell">
                      Entität
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-muted/60 hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => handleViewLogDetails(log)}
                    >
                      <td className="py-3 px-4 text-sm sm:text-base">
                        {format(new Date(log.date), "dd.MM.yyyy HH:mm", {
                          locale: de,
                        })}
                      </td>
                      <td className="py-3 px-4 text-sm sm:text-base">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                          <span>
                            {log.user && log.user.name
                              ? log.user.name
                              : log.userId || "Unbekannt"}
                          </span>
                          {log.user?.role && (
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                log.user.role === "ADMIN"
                                  ? "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                  : log.user.role === "MANAGER"
                                  ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                  : "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                              }`}
                            >
                              {log.user.role === "ADMIN"
                                ? "Admin"
                                : log.user.role === "MANAGER"
                                ? "Manager"
                                : "Benutzer"}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm sm:text-base">
                        {log.action}
                      </td>
                      <td className="py-3 px-4 text-sm sm:text-base hidden md:table-cell">
                        {log.entity || "-"}
                        {log.entityId && (
                          <span className="ml-1 text-muted-foreground">
                            ({log.entityId})
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Info className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Keine Logs verfügbar</p>
              <p className="text-muted-foreground mt-1">
                Es wurden keine Aktionen protokolliert
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Details Dialog */}
      <Dialog open={logDetailsOpen} onOpenChange={setLogDetailsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Log Details</DialogTitle>
            <DialogDescription>
              {selectedLog && (
                <span>
                  {format(new Date(selectedLog.date), "dd.MM.yyyy HH:mm:ss", {
                    locale: de,
                  })}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="font-medium">Benutzer:</div>
                <div className="col-span-2">
                  {selectedLog.user && selectedLog.user.name
                    ? selectedLog.user.name
                    : selectedLog.userId || "Unbekannt"}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="font-medium">Aktion:</div>
                <div className="col-span-2">{selectedLog.action}</div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="font-medium">Entität:</div>
                <div className="col-span-2">
                  {selectedLog.entity || "Nicht angegeben"}
                </div>
              </div>

              {selectedLog.entityId && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="font-medium">Entität ID:</div>
                  <div className="col-span-2">{selectedLog.entityId}</div>
                </div>
              )}

              {selectedLog.details && (
                <div className="space-y-2">
                  <div className="font-medium">Details:</div>
                  <div className="bg-muted p-3 rounded overflow-x-auto">
                    <pre className="text-sm whitespace-pre-wrap">
                      {typeof selectedLog.details === "string"
                        ? JSON.stringify(
                            JSON.parse(selectedLog.details),
                            null,
                            2
                          )
                        : JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {selectedLog.ipAddress && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="font-medium">IP-Adresse:</div>
                  <div className="col-span-2">{selectedLog.ipAddress}</div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setLogDetailsOpen(false)}>Schließen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
