"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Play,
  Square,
  Clock,
  Calendar as CalendarIcon,
  Edit,
  Check,
  Trash,
  Plus,
  CalendarPlus,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { format, isSameDay, addDays } from "date-fns";
import { toast } from "sonner";
import { de } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ManualBreakForm } from "@/components/ManualBreakForm";

// Add type for time entries
interface TimeEntry {
  id: number;
  startTime: string;
  endTime: string;
  duration: number;
  isMultiDay?: boolean;
  isStartDay?: boolean;
  isEndDay?: boolean;
  dayDuration?: number;
  displayDate?: string;
  isBreak?: boolean;
}

interface VacationData {
  id: number;
  startDate: string;
  endDate: string;
  days: number;
  status: "approved" | "rejected" | "pending";
}

// Helper function to check if a date is within the last 7 days
const isWithinLastSevenDays = (dateToCheck: Date): boolean => {
  const now = new Date();
  const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7));
  return dateToCheck >= sevenDaysAgo;
};

export default function Dashboard() {
  const { data: session } = useSession();
  const [date, setDate] = useState<Date>(new Date());
  const [isTracking, setIsTracking] = useState(false);
  const [trackingStart, setTrackingStart] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [todaysEntries, setTodaysEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // State for the edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);

  // State for creating time entries
  const [createEntryDialogOpen, setCreateEntryDialogOpen] = useState(false);
  const [newEntryForm, setNewEntryForm] = useState({
    startDate: format(new Date(), "yyyy-MM-dd"),
    startTime: format(new Date(), "HH:mm"),
    endDate: format(new Date(), "yyyy-MM-dd"),
    endTime: format(new Date(Date.now() + 60 * 60 * 1000), "HH:mm"),
  });

  // State for deleting time entries
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<TimeEntry | null>(null);

  // State for vacations
  const [vacations, setVacations] = useState<VacationData[]>([]);
  const [vacationStats, setVacationStats] = useState({
    totalDays: 30,
    takenDays: 0,
    remainingDays: 30,
  });
  const [vacationDialogOpen, setVacationDialogOpen] = useState(false);
  const [vacationForm, setVacationForm] = useState({
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(addDays(new Date(), 1), "yyyy-MM-dd"),
    description: "",
  });

  // Format time as HH:MM:SS
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Load any existing tracking session
  useEffect(() => {
    const checkCurrentSession = async () => {
      try {
        const response = await fetch("/api/time/current");
        const data = await response.json();

        if (data.currentSession) {
          setIsTracking(true);
          setTrackingStart(new Date(data.currentSession.startTime));
        }
      } catch (error) {
        console.error("Failed to check current session:", error);
      }
    };

    if (session?.user) {
      checkCurrentSession();
    }
  }, [session]);

  // Timer effect to update elapsed time
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isTracking && trackingStart) {
      interval = setInterval(() => {
        const now = new Date();
        const diff = Math.floor(
          (now.getTime() - trackingStart.getTime()) / 1000
        );
        setElapsedTime(diff);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTracking, trackingStart]);

  // Load time entries for the selected date
  useEffect(() => {
    const loadEntries = async () => {
      if (!session?.user) return;

      try {
        setIsLoading(true);
        const formattedDate = format(date, "yyyy-MM-dd");
        const response = await fetch(`/api/time/entries?date=${formattedDate}`);
        const data = await response.json();
        setTodaysEntries(data.entries || []);
      } catch {
        toast.error("Fehler beim Laden der Zeiteinträge");
      } finally {
        setIsLoading(false);
      }
    };

    loadEntries();
  }, [date, session]);

  // Load vacation data
  useEffect(() => {
    const fetchVacations = async () => {
      if (!session?.user) return;

      try {
        const response = await fetch("/api/vacation");
        const data = await response.json();

        if (response.ok) {
          setVacations(data.vacations || []);
          setVacationStats({
            totalDays: data.totalDays || 30,
            takenDays: data.takenDays || 0,
            remainingDays: data.remainingDays || 30,
          });
        }
      } catch (error) {
        console.error("Failed to fetch vacation data:", error);
        toast.error("Fehler beim Laden der Urlaubsdaten");
      }
    };

    fetchVacations();
  }, [session]);

  const handleStartTracking = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/time/start", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to start tracking");
      }

      const data = await response.json();
      setIsTracking(true);
      setTrackingStart(new Date(data.startTime));
      setElapsedTime(0);
      toast.success("Zeiterfassung gestartet");
    } catch {
      toast.error("Fehler beim Starten der Zeiterfassung");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopTracking = async () => {
    try {
      if (!trackingStart) return;

      setIsLoading(true);
      const response = await fetch("/api/time/stop", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to stop tracking");
      }

      setIsTracking(false);
      setTrackingStart(null);

      // Reload entries for today
      if (isSameDay(date, new Date())) {
        const entriesResponse = await fetch(
          `/api/time/entries?date=${format(date, "yyyy-MM-dd")}`
        );
        const entriesData = await entriesResponse.json();
        setTodaysEntries(entriesData.entries || []);
      }

      toast.success("Zeiterfassung beendet");
    } catch {
      toast.error("Fehler beim Beenden der Zeiterfassung");
    } finally {
      setIsLoading(false);
    }
  };

  // Open edit dialog for a time entry
  const handleEditEntry = (entry: TimeEntry) => {
    const startDate = new Date(entry.startTime);
    const endDate = new Date(entry.endTime);

    // Check if the entry is within the last 7 days
    if (!isWithinLastSevenDays(startDate)) {
      toast.error(
        "Zeiteinträge können nur für die letzten 7 Tage bearbeitet werden"
      );
      return;
    }

    setEditingEntry(entry);

    setNewEntryForm({
      startDate: format(startDate, "yyyy-MM-dd"),
      startTime: format(startDate, "HH:mm"),
      endDate: format(endDate, "yyyy-MM-dd"),
      endTime: format(endDate, "HH:mm"),
    });
    
    setEditDialogOpen(true);
  };

  // Save edited time entry
  const handleSaveEdit = async () => {
    try {
      setIsLoading(true);

      // Validate form
      if (!newEntryForm.startDate || !newEntryForm.startTime || !newEntryForm.endDate || !newEntryForm.endTime) {
        throw new Error("Alle Felder müssen ausgefüllt sein");
      }

      // Create datetime objects
      const startDateTime = new Date(`${newEntryForm.startDate}T${newEntryForm.startTime}:00`);
      const endDateTime = new Date(`${newEntryForm.endDate}T${newEntryForm.endTime}:00`);

      // Validate date is within last 7 days
      const now = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);

      if (startDateTime < sevenDaysAgo) {
        throw new Error(
          "Zeiteinträge können nur innerhalb der letzten 7 Tage gesetzt werden"
        );
      }

      // Validate end is after start
      if (endDateTime <= startDateTime) {
        throw new Error("Endzeit muss nach der Startzeit liegen");
      }

      const response = await fetch(`/api/time/update/${editingEntry?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Fehler beim Aktualisieren");
      }

      toast.success("Zeiteintrag erfolgreich aktualisiert");
      setEditDialogOpen(false);
      
      // Reset form
      setNewEntryForm({
        startDate: "",
        startTime: "",
        endDate: "",
        endTime: "",
      });

      // Reload entries for the current date
      try {
        const formattedDate = format(date, "yyyy-MM-dd");
        const response = await fetch(`/api/time/entries?date=${formattedDate}`);
        const data = await response.json();
        setTodaysEntries(data.entries || []);
      } catch {
        toast.error("Fehler beim Laden der Zeiteinträge");
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.message || "Fehler beim Aktualisieren");
    } finally {
      setIsLoading(false);
    }
  };

  // Open dialog to create a new time entry
  const handleCreateEntryDialog = () => {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    setNewEntryForm({
      startDate: format(now, "yyyy-MM-dd"),
      startTime: format(now, "HH:mm"),
      endDate: format(oneHourLater, "yyyy-MM-dd"),
      endTime: format(oneHourLater, "HH:mm"),
    });

    setCreateEntryDialogOpen(true);
  };

  const handleCreateEntry = async () => {
    try {
      setIsLoading(true);

      // Create full datetime strings
      const startDateTime = `${newEntryForm.startDate}T${newEntryForm.startTime}:00`;
      const endDateTime = `${newEntryForm.endDate}T${newEntryForm.endTime}:00`;

      const response = await fetch("/api/time/manual-entry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startTime: startDateTime,
          endTime: endDateTime,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error || "Fehler beim Erstellen des Zeiteintrags"
        );
      }

      // Close dialog
      setCreateEntryDialogOpen(false);

      // Reload entries
      const entriesResponse = await fetch(
        `/api/time/entries?date=${format(date, "yyyy-MM-dd")}`
      );
      const entriesData = await entriesResponse.json();
      setTodaysEntries(entriesData.entries || []);

      toast.success("Zeiteintrag erstellt");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.message || "Fehler beim Erstellen des Zeiteintrags");
    } finally {
      setIsLoading(false);
    }
  };

  // Open delete confirmation dialog
  const handleDeletePrompt = (entry: TimeEntry) => {
    const startDate = new Date(entry.startTime);

    // Check if the entry is within the last 7 days
    if (!isWithinLastSevenDays(startDate)) {
      toast.error(
        "Zeiteinträge können nur für die letzten 7 Tage gelöscht werden"
      );
      return;
    }

    setEntryToDelete(entry);
    setDeleteDialogOpen(true);
  };

  // Delete time entry
  const handleDeleteEntry = async () => {
    if (!entryToDelete) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/time/entries/${entryToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete entry");
      }

      // Close dialog
      setDeleteDialogOpen(false);

      // Reload entries
      const entriesResponse = await fetch(
        `/api/time/entries?date=${format(date, "yyyy-MM-dd")}`
      );
      const entriesData = await entriesResponse.json();
      setTodaysEntries(entriesData.entries || []);

      toast.success("Zeiteintrag gelöscht");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.message || "Fehler beim Löschen des Zeiteintrags");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle vacation request
  const handleVacationRequest = async () => {
    try {
      setIsLoading(true);

      const response = await fetch("/api/vacation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate: vacationForm.startDate,
          endDate: vacationForm.endDate,
          description: vacationForm.description,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Fehler beim Beantragen des Urlaubs");
      }

      // Close dialog
      setVacationDialogOpen(false);

      // Reload vacation data
      const refreshResponse = await fetch("/api/vacation");
      const refreshData = await refreshResponse.json();

      setVacations(refreshData.vacations || []);
      setVacationStats({
        totalDays: refreshData.totalDays || 30,
        takenDays: refreshData.takenDays || 0,
        remainingDays: refreshData.remainingDays || 30,
      });

      toast.success("Urlaubsantrag erfolgreich eingereicht");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.message || "Fehler beim Beantragen des Urlaubs");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate total hours worked today
  const totalSecondsWorked =
    todaysEntries.reduce((total, entry) => {
      // Only add to total if it's not a break entry
      return entry.isBreak ? total : total + entry.duration;
    }, 0) + (isTracking ? elapsedTime : 0);

  return (
    <div className="max-w-7xl mx-auto pt-16 mb-6">
      <h1 className="text-3xl font-bold mb-8">Zeiterfassung</h1>
        
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Time Tracking Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Aktuelle Zeiterfassung</CardTitle>
            <CardDescription>
              {isTracking
                ? `Seit ${
                    trackingStart
                      ? format(trackingStart, "HH:mm", { locale: de })
                      : "--:--"
                  } Uhr`
                : "Keine aktive Zeiterfassung"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-6">
              {/* Current Timer Display */}
              <div className="text-center">
                <div className="text-4xl font-mono font-bold">
                  {isTracking ? formatTime(elapsedTime) : "00:00:00"}
                </div>
                <p className="text-muted-foreground mt-2">
                  {isTracking ? "Laufende Zeit" : "Bereit zum Starten"}
                </p>
              </div>

              {/* Control Buttons */}
              <div className="flex justify-center gap-4">
                <Button
                  size="lg"
                  onClick={handleStartTracking}
                  disabled={isTracking || isLoading}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Start
                </Button>
                <Button
                  size="lg"
                  onClick={handleStopTracking}
                  disabled={!isTracking || isLoading}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  <Square className="mr-2 h-4 w-4" />
                  Stop
                </Button>
              </div>

              {/* Today's Stats */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center">
                  <Clock className="mr-2 h-4 w-4" />
                  Heutige Arbeitszeit
                </h3>
                <div className="text-2xl font-bold">
                  {formatTime(totalSecondsWorked)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {Math.floor(totalSecondsWorked / 3600)} Std.{" "}
                  {Math.floor((totalSecondsWorked % 3600) / 60)} Min.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendar Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarIcon className="mr-2 h-4 w-4" />
              Kalender
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row justify-between gap-2">
              <div>
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => newDate && setDate(newDate)}
                  className="border rounded-md p-3"
                  modifiers={{
                    vacation: (day) => {
                      return vacations
                        .filter(v => v.status === "approved")
                        .some(v => {
                          try {
                            const start = new Date(v.startDate);
                            start.setHours(0, 0, 0, 0);
                            const end = new Date(v.endDate);
                            end.setHours(23, 59, 59, 999);
                            const currentDate = new Date(day);
                            currentDate.setHours(0, 0, 0, 0);
                            const dayOfWeek = currentDate.getDay();
                            const isWeekday = dayOfWeek > 0 && dayOfWeek < 6;
                            return isWeekday && currentDate >= start && currentDate <= end;
                          } catch (error) {
                            console.error("Fehler beim Vergleich von Urlaubsdaten:", error);
                            return false;
                          }
                        });
                    },
                    hasEntries: (day) => {
                      const dateStr = format(day, "yyyy-MM-dd");
                      return todaysEntries.some(entry => entry.startTime.startsWith(dateStr));
                    }
                  }}
                  modifiersClassNames={{
                    vacation: "bg-green-100 dark:bg-green-900/30 rounded-xl",
                    hasEntries: "font80 rounded-xl old"
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Time Entries List */}
        <Card className="md:col-span-3">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                Zeiteinträge für {format(date, "dd. MMMM yyyy", { locale: de })}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleCreateEntryDialog}
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                >
                  <Clock className="mr-1 h-4 w-4" />
                  Manueller Eintrag
                </Button>
                <ManualBreakForm />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : todaysEntries.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Start</th>
                      <th className="text-left py-3 px-4">Ende</th>
                      <th className="text-left py-3 px-4">Dauer</th>
                      <th className="text-right py-3 px-4">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todaysEntries.map((entry) => {
                      const entryDate = new Date(entry.startTime);
                      const isEditable =
                        isWithinLastSevenDays(entryDate) && !entry.isBreak;

                      return (
                        <tr
                          key={`${entry.id}-${entry.displayDate}`}
                          className={`border-b border-muted ${
                            entry.isBreak
                              ? "bg-amber-50 dark:bg-amber-900/20"
                              : ""
                          }`}
                        >
                          <td className="py-3 px-4">
                            {format(
                              new Date(entry.startTime),
                              entry.isMultiDay && !entry.isStartDay
                                ? "'Vorheriger Tag'"
                                : "HH:mm",
                              { locale: de }
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {format(
                              new Date(entry.endTime),
                              entry.isMultiDay && !entry.isEndDay
                                ? "'Nächster Tag'"
                                : "HH:mm",
                              { locale: de }
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {formatTime(
                              entry.isMultiDay
                                ? entry.dayDuration ?? 0
                                : entry.duration
                            )}
                            {entry.isMultiDay && (
                              <span className="ml-2 text-xs px-1.5 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full">
                                Mehrtägig
                              </span>
                            )}
                            {!isEditable && !entry.isBreak && (
                              <span className="ml-2 text-xs px-1.5 py-0.5 bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 rounded-full">
                                Nicht bearbeitbar
                              </span>
                            )}
                            {entry.isBreak && (
                              <span className="ml-2 text-xs px-1.5 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 rounded-full">
                                Pause
                              </span>
                            )}
                          </td>
                          <td className="w-24 pr-4">
                            <div className="flex justify-end gap-1">
                              {isEditable ? (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditEntry(entry)}
                                    className="h-8 w-8"
                                  >
                                    <Edit className="h-4 w-4" />
                                    <span className="sr-only">Bearbeiten</span>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeletePrompt(entry)}
                                    className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                  >
                                    <Trash className="h-4 w-4" />
                                    <span className="sr-only">Löschen</span>
                                  </Button>
                                </>
                              ) : (
                                <div className="text-xs text-muted-foreground italic px-2">
                                  {entry.isBreak ? "Auto" : "Gesperrt"}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Keine Zeiteinträge für diesen Tag
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enlarged Vacation Overview Card */}
        <Card className="md:col-span-3">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center">
                <CalendarIcon className="mr-2 h-5 w-5" />
                Urlaubsübersicht
              </CardTitle>
              <Button
                onClick={() => setVacationDialogOpen(true)}
                variant="outline"
                size="sm"
              >
                <Plus className="mr-1 h-4 w-4" />
                Urlaub beantragen
              </Button>
            </div>
            <CardDescription>Ihr Urlaubskontingent und Anträge</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-muted/40 p-4 rounded-lg text-center">
                  <div className="text-muted-foreground mb-1">Gesamt</div>
                  <div className="text-3xl font-bold">
                    {vacationStats.totalDays}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Urlaubstage
                  </div>
                </div>
                <div className="bg-muted/40 p-4 rounded-lg text-center">
                  <div className="text-muted-foreground mb-1">Genommen</div>
                  <div className="text-3xl font-bold">
                    {vacationStats.takenDays}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Urlaubstage
                  </div>
                </div>
                <div
                  className={`p-4 rounded-lg text-center 
                    ${vacationStats.remainingDays > 10
                      ? 'bg-green-50 dark:bg-green-900/20'
                      : vacationStats.remainingDays > 5
                      ? 'bg-amber-50 dark:bg-amber-900/20'
                      : vacationStats.remainingDays >= 0
                      ? 'bg-red-100 dark:bg-red-900/30'
                      : 'bg-red-200 dark:bg-red-950'}
                  `}
                >
                  <div className="text-muted-foreground mb-1">Verbleibend</div>
                  <div
                    className={`text-3xl font-bold 
                      ${vacationStats.remainingDays > 10
                        ? 'text-green-600 dark:text-green-400'
                        : vacationStats.remainingDays > 5
                        ? 'text-amber-600 dark:text-amber-400'
                        : vacationStats.remainingDays >= 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-red-800 dark:text-red-300'}`}
                  >
                    {vacationStats.remainingDays}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Urlaubstage
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Urlaubsnutzung</span>
                  <span>
                    {Math.round(
                      (vacationStats.takenDays / vacationStats.totalDays) * 100
                    )}
                    %
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5">
                  <div
                    className="bg-primary h-2.5 rounded-full"
                    style={{
                      width: `${Math.min(
                        (vacationStats.takenDays / vacationStats.totalDays) *
                        100,
                        100
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Vacation request history list */}
              <div>
                <h3 className="text-base font-medium mb-3">
                  Ihre Urlaubsanträge
                </h3>
                {vacations.length > 0 ? (
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted/50 border-b">
                          <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">
                            Zeitraum
                          </th>
                          <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground">
                            Tage
                          </th>
                          <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {vacations.map((vacation) => {
                          // Parse the start and end dates
                          const startDate = new Date(vacation.startDate);
                          const endDate = new Date(vacation.endDate);
                          const isValidDate =
                            !isNaN(startDate.getTime()) &&
                            !isNaN(endDate.getTime());

                          return (
                            <tr
                              key={vacation.id}
                              className="border-b hover:bg-muted/30 transition-colors"
                            >
                              <td className="py-3 px-4">
                                {isValidDate ? (
                                  <div className="flex flex-col">
                                    <span className="font-medium">
                                      {format(startDate, "dd.MM.yyyy", {
                                        locale: de,
                                      })}{" "}
                                      -{" "}
                                      {format(endDate, "dd.MM.yyyy", {
                                        locale: de,
                                      })}
                                    </span>
                                    <span className="text-xs text-muted-foreground mt-1">
                                      {format(startDate, "EEEE", {
                                        locale: de,
                                      })}{" "}
                                      bis{" "}
                                      {format(endDate, "EEEE", { locale: de })}
                                    </span>
                                  </div>
                                ) : (
                                  "Ungültiges Datum"
                                )}
                              </td>
                              <td className="py-3 px-4 text-center font-medium">
                                {vacation.days}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex justify-center">
                                  <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                                      vacation.status === "approved"
                                        ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                        : vacation.status === "rejected"
                                        ? "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                        : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                    }`}
                                  >
                                    {vacation.status === "approved"
                                      ? "Genehmigt"
                                      : vacation.status === "rejected"
                                      ? "Abgelehnt"
                                      : "Ausstehend"}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-muted/10">
                    <CalendarIcon className="h-10 w-10 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground text-center">
                      Sie haben noch keine Urlaubsanträge gestellt
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setVacationDialogOpen(true)}
                      className="mt-4"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Ersten Urlaub beantragen
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Entry Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Zeiteintrag bearbeiten</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-startDate">Startdatum</Label>
                <Input
                  id="edit-startDate"
                  type="date"
                  value={newEntryForm.startDate}
                  onChange={(e) =>
                    setNewEntryForm({
                      ...newEntryForm,
                      startDate: e.target.value,
                    })
                  }
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-startTime">Startzeit</Label>
                <Input
                  id="edit-startTime"
                  type="time"
                  value={newEntryForm.startTime}
                  onChange={(e) =>
                    setNewEntryForm({
                      ...newEntryForm,
                      startTime: e.target.value,
                    })
                  }
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-endDate">Enddatum</Label>
                <Input
                  id="edit-endDate"
                  type="date"
                  value={newEntryForm.endDate}
                  onChange={(e) =>
                    setNewEntryForm({
                      ...newEntryForm,
                      endDate: e.target.value,
                    })
                  }
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-endTime">Endzeit</Label>
                <Input
                  id="edit-endTime"
                  type="time"
                  value={newEntryForm.endTime}
                  onChange={(e) =>
                    setNewEntryForm({
                      ...newEntryForm,
                      endTime: e.target.value,
                    })
                  }
                  className="w-full"
                />
              </div>
            </div>

            {/* Calculate and show duration */}
            {newEntryForm.startDate &&
              newEntryForm.startTime &&
              newEntryForm.endDate &&
              newEntryForm.endTime &&
              (() => {
                try {
                  const start = new Date(
                    `${newEntryForm.startDate}T${newEntryForm.startTime}:00`
                  );
                  const end = new Date(
                    `${newEntryForm.endDate}T${newEntryForm.endTime}:00`
                  );
                  const duration = Math.floor(
                    (end.getTime() - start.getTime()) / 1000
                  );

                  return (
                    <div className="bg-muted rounded-md p-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Berechnete Dauer:</span>
                        <span
                          className={`font-mono ${
                            duration < 0
                              ? "text-destructive"
                              : "text-green-600 dark:text-green-400"
                          }`}
                        >
                          {duration < 0 ? "Ungültig" : formatTime(duration)}
                        </span>
                      </div>
                    </div>
                  );
                } catch {
                  return null;
                }
              })()}
          </div>
          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={isLoading}
              className="hidden sm:flex"
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full" />
                  <span>Speichern...</span>
                </div>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Speichern
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Zeiteintrag erstellen Dialog */}
      <Dialog
        open={createEntryDialogOpen}
        onOpenChange={setCreateEntryDialogOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Neuen Zeiteintrag erstellen
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Startdatum</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={newEntryForm.startDate}
                  onChange={(e) =>
                    setNewEntryForm({
                      ...newEntryForm,
                      startDate: e.target.value,
                    })
                  }
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startTime">Startzeit</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={newEntryForm.startTime}
                  onChange={(e) =>
                    setNewEntryForm({
                      ...newEntryForm,
                      startTime: e.target.value,
                    })
                  }
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="endDate">Enddatum</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={newEntryForm.endDate}
                  onChange={(e) =>
                    setNewEntryForm({
                      ...newEntryForm,
                      endDate: e.target.value,
                    })
                  }
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">Endzeit</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={newEntryForm.endTime}
                  onChange={(e) =>
                    setNewEntryForm({
                      ...newEntryForm,
                      endTime: e.target.value,
                    })
                  }
                  className="w-full"
                />
              </div>
            </div>

            {/* Calculate and show duration */}
            {newEntryForm.startDate &&
              newEntryForm.startTime &&
              newEntryForm.endDate &&
              newEntryForm.endTime &&
              (() => {
                try {
                  const start = new Date(
                    `${newEntryForm.startDate}T${newEntryForm.startTime}:00`
                  );
                  const end = new Date(
                    `${newEntryForm.endDate}T${newEntryForm.endTime}:00`
                  );
                  const duration = Math.floor(
                    (end.getTime() - start.getTime()) / 1000
                  );

                  return (
                    <div className="bg-muted rounded-md p-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Berechnete Dauer:</span>
                        <span
                          className={`font-mono ${
                            duration < 0
                              ? "text-destructive"
                              : "text-green-600 dark:text-green-400"
                          }`}
                        >
                          {duration < 0 ? "Ungültig" : formatTime(duration)}
                        </span>
                      </div>
                    </div>
                  );
                } catch {
                  return null;
                }
              })()}
          </div>
          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setCreateEntryDialogOpen(false)}
              disabled={isLoading}
              className="hidden sm:flex"
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleCreateEntry}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full" />
                  <span>Speichern...</span>
                </div>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Erstellen
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Entry Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Zeiteintrag löschen</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">
              Sind Sie sicher, dass Sie diesen Zeiteintrag löschen möchten?
            </p>
            {entryToDelete && (
              <div className="p-4 border rounded-md bg-muted">
                <div className="grid grid-cols-3 gap-2 mb-1">
                  <span className="font-medium">Start:</span>
                  <span className="col-span-2">
                    {format(
                      new Date(entryToDelete.startTime),
                      "dd.MM.yyyy HH:mm",
                      { locale: de }
                    )}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-1">
                  <span className="font-medium">Ende:</span>
                  <span className="col-span-2">
                    {format(
                      new Date(entryToDelete.endTime),
                      "dd.MM.yyyy HH:mm",
                      { locale: de }
                    )}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-medium">Dauer:</span>
                  <span className="col-span-2">
                    {formatTime(entryToDelete.duration)}
                  </span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isLoading}
            >
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteEntry}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full" />
                  <span>Löschen...</span>
                </div>
              ) : (
                <>
                  <Trash className="mr-2 h-4 w-4" />
                  Löschen
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Vacation Dialog */}
      <Dialog open={vacationDialogOpen} onOpenChange={setVacationDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Urlaub beantragen</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Erster Urlaubstag</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={vacationForm.startDate}
                  onChange={(e) =>
                    setVacationForm({
                      ...vacationForm,
                      startDate: e.target.value,
                    })
                  }
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Letzter Urlaubstag</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={vacationForm.endDate}
                  onChange={(e) =>
                    setVacationForm({
                      ...vacationForm,
                      endDate: e.target.value,
                    })
                  }
                  className="w-full"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Bemerkung (optional)</Label>
              <Textarea
                id="description"
                value={vacationForm.description}
                onChange={(e) =>
                  setVacationForm({
                    ...vacationForm,
                    description: e.target.value,
                  })
                }
                className="w-full"
                placeholder="z.B. Familienurlaub"
                rows={3}
              />
            </div>

            {/* Calculate Vacation days */}
            {(() => {
              try {
                const start = new Date(vacationForm.startDate);
                const end = new Date(vacationForm.endDate);

                // Calculate the number of days between start & end (Mo-Fr)
                let days = 0;
                const current = new Date(start);
                while (current <= end) {
                  const dayOfWeek = current.getDay();
                  if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                    days++;
                  }
                  current.setDate(current.getDate() + 1);
                }

                return (
                  <div className="bg-muted rounded-md p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Urlaubstage (Mo-Fr):</span>
                      <span
                        className={`font-mono ${
                          days <= 0
                            ? "text-destructive"
                            : days <= vacationStats.remainingDays
                            ? "text-green-600 dark:text-green-400"
                            : "text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {days <= 0
                          ? "Ungültiger Zeitraum"
                          : days === 1
                          ? "1 Tag"
                          : `${days} Tage`}
                      </span>
                    </div>
                    {days > vacationStats.remainingDays && (
                      <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                        Warnung: Der Antrag überschreitet Ihre verbleibenden
                        Urlaubstage ({vacationStats.remainingDays}).
                      </div>
                    )}
                  </div>
                );
              } catch {
                return null;
              }
            })()}
          </div>
          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setVacationDialogOpen(false)}
              disabled={isLoading}
              className="hidden sm:flex"
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleVacationRequest}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full" />
                  <span>Speichern...</span>
                </div>
              ) : (
                <>
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  Urlaub beantragen
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
