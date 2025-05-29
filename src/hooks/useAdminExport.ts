import { useState } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export function useAdminExport() {
  const [exportPeriod, setExportPeriod] = useState("month");
  const [exportUserId, setExportUserId] = useState("all");
  const [exportLoading, setExportLoading] = useState(false);
  
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
        const error = await response.json();
        throw new Error(error.message || "Export fehlgeschlagen");
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
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Fehler beim Erstellen des Exports";
      toast.error(errorMessage);
    } finally {
      setExportLoading(false);
    }
  };

  return {
    exportPeriod,
    setExportPeriod,
    exportUserId,
    setExportUserId,
    exportLoading,
    handleExport
  };
}