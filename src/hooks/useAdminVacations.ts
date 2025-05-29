import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { VacationData } from '@/types/dashboard';

export function useAdminVacations() {
  const [vacations, setVacations] = useState<VacationData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const fetchVacations = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/vacation");
      const data = await response.json();
      setVacations(data.vacations || []);
    } catch (error) {
      console.error("Failed to fetch vacations:", error);
      toast.error("Fehler beim Laden der Urlaubsanträge");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateVacationStatus = async (
    id: number, 
    status: "PENDING" | "APPROVED" | "REJECTED"
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/vacation/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Fehler beim Aktualisieren des Urlaubsantrags");
      }
      
      await fetchVacations();
      toast.success("Urlaubsantrag erfolgreich aktualisiert");
      return true;
    } catch (error) {
      console.error("Failed to update vacation status:", error);
      toast.error(error instanceof Error ? error.message : "Fehler beim Aktualisieren des Urlaubsantrags");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    vacations,
    isLoading,
    fetchVacations,
    updateVacationStatus
  };
}