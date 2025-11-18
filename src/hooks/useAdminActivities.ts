import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { format, subDays } from 'date-fns';
import { TrackedTime, User } from '@prisma/client';

// Extended type that includes user info
export interface TimeEntryWithUser extends TrackedTime {
  user?: User;
}

interface TimeEntryUpdateData {
  startTime: string;
  endTime: string;
}

interface TimeEntryCreateData {
  userId: string;
  startTime: string;
  endTime: string;
}

export function useAdminActivities() {
  const [timeEntries, setTimeEntries] = useState<TimeEntryWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filteredUserId, setFilteredUserId] = useState<string | null>(null);
  const [filteredUserName, setFilteredUserName] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>(() => ({
    start: subDays(new Date(), 7),
    end: new Date()
  }));
  
  const fetchTimeEntries = useCallback(async (userId: string | null = null, startDate?: Date, endDate?: Date) => {
    try {
      setIsLoading(true);
      
      // Use provided dates or create new defaults
      let actualStartDate: Date;
      let actualEndDate: Date;
      
      if (startDate && endDate) {
        actualStartDate = startDate;
        actualEndDate = endDate;
      } else {
        // If no dates provided, use current state or defaults
        actualEndDate = new Date();
        actualStartDate = subDays(actualEndDate, 7);
      }

      // Validate dates
      if (isNaN(actualStartDate.getTime()) || isNaN(actualEndDate.getTime())) {
        throw new Error("Invalid date range");
      }

      if (actualStartDate > actualEndDate) {
        toast.error("Startdatum muss vor dem Enddatum liegen");
        return;
      }

      // Update date range state if custom dates were provided
      if (startDate && endDate) {
        setDateRange({ start: startDate, end: endDate });
      }

      let url = `/api/admin/time-entries?startDate=${format(
        actualStartDate,
        "yyyy-MM-dd"
      )}&endDate=${format(actualEndDate, "yyyy-MM-dd")}`;

      // Filter by user if userId is provided
      if (userId) {
        url += `&userId=${encodeURIComponent(userId)}`;
        setFilteredUserId(userId);
      } else {
        setFilteredUserId(null);
        setFilteredUserName(null);
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setTimeEntries(data.entries || []);
    } catch (error) {
      console.error("Failed to fetch time entries:", error);
      toast.error("Fehler beim Laden der Zeiteinträge");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createTimeEntry = async (entryData: TimeEntryCreateData): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entryData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Fehler beim Erstellen des Zeiteintrags");
      }
      
      await fetchTimeEntries(filteredUserId);
      toast.success("Zeiteintrag erfolgreich erstellt");
      return true;
    } catch (error) {
      console.error("Failed to create time entry:", error);
      toast.error(error instanceof Error ? error.message : "Fehler beim Erstellen des Zeiteintrags");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateTimeEntry = async (entryId: string, entryData: TimeEntryUpdateData): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/time-entries/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entryData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Fehler beim Aktualisieren des Zeiteintrags");
      }
      
      await fetchTimeEntries(filteredUserId);
      toast.success("Zeiteintrag erfolgreich aktualisiert");
      return true;
    } catch (error) {
      console.error("Failed to update time entry:", error);
      toast.error(error instanceof Error ? error.message : "Fehler beim Aktualisieren des Zeiteintrags");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTimeEntry = async (entryId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/time-entries/${entryId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Fehler beim Löschen des Zeiteintrags");
      }
      
      await fetchTimeEntries(filteredUserId);
      toast.success("Zeiteintrag erfolgreich gelöscht");
      return true;
    } catch (error) {
      console.error("Failed to delete time entry:", error);
      toast.error(error instanceof Error ? error.message : "Fehler beim Löschen des Zeiteintrags");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const filterByUser = (userId: string, userName: string) => {
    setFilteredUserId(userId);
    setFilteredUserName(userName);
    fetchTimeEntries(userId);
  };

  const clearFilter = () => {
    setFilteredUserId(null);
    setFilteredUserName(null);
    fetchTimeEntries();
  };

  const updateDateRange = (start: Date, end: Date) => {
    if (start > end) {
      toast.error("Startdatum muss vor dem Enddatum liegen");
      return;
    }
    setDateRange({ start, end });
    fetchTimeEntries(filteredUserId, start, end);
  };

  return {
    timeEntries,
    isLoading,
    filteredUserId,
    filteredUserName,
    dateRange,
    fetchTimeEntries,
    createTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
    filterByUser,
    clearFilter,
    updateDateRange
  };
}