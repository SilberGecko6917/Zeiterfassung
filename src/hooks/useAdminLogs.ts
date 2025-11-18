import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export function useAdminLogs() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const fetchLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/logs");
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
      toast.error("Fehler beim Laden der Logs");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    logs,
    isLoading,
    fetchLogs
  };
}