import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export function useAdminBreaks() {
  const [usersWithBreakSettings, setUsersWithBreakSettings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const fetchBreakSettings = useCallback(async () => {
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
  }, []);

  const saveBreakSettings = async (userId: string, breakDuration: number, autoInsert: boolean) => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/break-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          breakDuration,
          autoInsert
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Fehler beim Speichern der Pauseneinstellungen");
      }
      
      await fetchBreakSettings();
      toast.success("Pauseneinstellungen erfolgreich gespeichert");
      return true;
    } catch (error) {
      console.error("Failed to save break settings:", error);
      const errorMessage = (error instanceof Error) ? error.message : "Fehler beim Speichern der Pauseneinstellungen";
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    usersWithBreakSettings,
    isLoading,
    fetchBreakSettings,
    saveBreakSettings
  };
}