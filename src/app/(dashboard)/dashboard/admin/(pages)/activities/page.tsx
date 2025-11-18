"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Edit, Trash, X, RefreshCw, CalendarDays } from "lucide-react";
import { format, subDays, isSameDay, startOfDay, endOfDay } from "date-fns";
import { de } from "date-fns/locale";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  useAdminActivities,
  TimeEntryWithUser,
} from "@/hooks/useAdminActivities";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { TimeEntryDialog } from "@/components/admin/TimeEntryDialog";
import { CreateTimeEntryDialog } from "@/components/admin/CreateTimeEntryDialog";
import { DeleteTimeEntryDialog } from "@/components/admin/DeleteTimeEntryDialog";
import { useSearchParams, useRouter } from "next/navigation";

export default function ActivitiesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { users, fetchUsers } = useAdminUsers();
  const {
    timeEntries,
    isLoading,
    filteredUserId,
    filteredUserName,
    dateRange,
    fetchTimeEntries,
    filterByUser,
    clearFilter,
    updateDateRange,
  } = useAdminActivities();

  // Time entry dialogs
  const [timeEntryDialogOpen, setTimeEntryDialogOpen] = useState(false);
  const [createTimeEntryDialogOpen, setCreateTimeEntryDialogOpen] =
    useState(false);
  const [deleteTimeEntryDialogOpen, setDeleteTimeEntryDialogOpen] =
    useState(false);
  const [editingTimeEntry, setEditingTimeEntry] =
    useState<TimeEntryWithUser | null>(null);
  const [timeEntryToDelete, setTimeEntryToDelete] =
    useState<TimeEntryWithUser | null>(null);

  // Date range selector state
  const [dateRangePreset, setDateRangePreset] = useState<string>("7");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  // Add this ref to track if initial data has been loaded
  const initialLoadComplete = useRef(false);

  // Format time as HH:MM:SS
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Helper function to get user name
  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user ? user.name : `Benutzer ${userId}`;
  };

  // Handle date range preset change
  const handleDateRangePresetChange = (value: string) => {
    setDateRangePreset(value);
    
    if (value === "custom") {
      setShowCustomDatePicker(true);
      // Initialize custom dates with current range
      setCustomStartDate(dateRange.start);
      setCustomEndDate(dateRange.end);
    } else {
      setShowCustomDatePicker(false);
      const endDate = endOfDay(new Date());
      let startDate: Date;
      
      switch (value) {
        case "7":
          startDate = startOfDay(subDays(endDate, 7));
          break;
        case "14":
          startDate = startOfDay(subDays(endDate, 14));
          break;
        case "30":
          startDate = startOfDay(subDays(endDate, 30));
          break;
        case "90":
          startDate = startOfDay(subDays(endDate, 90));
          break;
        default:
          startDate = startOfDay(subDays(endDate, 7));
      }
      
      updateDateRange(startDate, endDate);
    }
  };

  // Handle custom date range application
  const handleApplyCustomDateRange = () => {
    if (customStartDate && customEndDate) {
      const start = startOfDay(customStartDate);
      const end = endOfDay(customEndDate);
      
      if (start > end) {
        // Error handling is in updateDateRange
        return;
      }
      
      updateDateRange(start, end);
      // Keep the custom date picker visible
    }
  };

  // Modify the useEffect hook to prevent infinite refreshes
  useEffect(() => {
    // Only fetch users once
    if (!initialLoadComplete.current) {
      fetchUsers();
      initialLoadComplete.current = true;

      // Check for URL parameters (used when coming from user page)
      const userId = searchParams.get("userId");
      const userName = searchParams.get("userName");

      if (userId && userName) {
        filterByUser(userId, decodeURIComponent(userName));
      } else {
        fetchTimeEntries();
      }
    }
  }, [fetchTimeEntries, fetchUsers, filterByUser, searchParams]);

  // Handle creating a new time entry
  const handleCreateTimeEntry = () => {
    setCreateTimeEntryDialogOpen(true);
  };

  // Handle editing a time entry
  const handleEditTimeEntry = (entry: TimeEntryWithUser) => {
    setEditingTimeEntry(entry);
    setTimeEntryDialogOpen(true);
  };

  // Handle deleting a time entry
  const handleDeleteTimeEntryPrompt = (entry: TimeEntryWithUser) => {
    setTimeEntryToDelete(entry);
    setDeleteTimeEntryDialogOpen(true);
  };

  // Handle clearing the filter
  const handleClearFilter = () => {
    clearFilter();
    // Remove query parameters from URL
    router.push("/dashboard/admin/activities");
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-0 max-w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Zeiterfassung
          </h1>
          <p className="text-muted-foreground mt-2">
            {filteredUserName
              ? `Aktivitäten von ${filteredUserName}`
              : "Zeiteinträge anzeigen"}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 items-center w-full sm:w-auto">
          {filteredUserId && (
            <Button
              variant="outline"
              onClick={handleClearFilter}
              size="sm"
              className="w-full sm:w-auto"
            >
              <X className="mr-1 h-4 w-4" />
              Filter aufheben
            </Button>
          )}
          <Button onClick={handleCreateTimeEntry} className="w-full sm:w-auto">
            <Clock className="mr-2 h-4 w-4" />
            Eintrag erstellen
          </Button>
        </div>
      </div>

      {/* Filter box */}
      <Card className="mb-4">
        <CardContent className="py-4">
          <div className="flex flex-col gap-4">
            {/* Filters Row - User and Date Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* User Filter */}
              <div className="w-full">
                <Label htmlFor="userFilter" className="mb-1 block">
                  Nach Benutzer filtern
                </Label>
                <Select
                  value={filteredUserId || "all"}
                  onValueChange={(value) => {
                    if (value === "all") {
                      handleClearFilter();
                    } else {
                      const selectedUser = users.find((u) => u.id === value);
                      if (selectedUser && selectedUser.name) {
                        filterByUser(value, selectedUser.name);
                        router.push(
                          `/dashboard/admin/activities?userId=${value}&userName=${encodeURIComponent(
                            selectedUser.name
                          )}`
                        );
                      }
                    }
                  }}
                >
                  <SelectTrigger id="userFilter">
                    <SelectValue placeholder="Benutzer auswählen" />
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
              </div>

              {/* Date Range Preset */}
              <div className="w-full">
                <Label htmlFor="dateRangePreset" className="mb-1 block">
                  Zeitraum
                </Label>
                <Select
                  value={dateRangePreset}
                  onValueChange={handleDateRangePresetChange}
                >
                  <SelectTrigger id="dateRangePreset">
                    <SelectValue placeholder="Zeitraum auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Letzte 7 Tage</SelectItem>
                    <SelectItem value="14">Letzte 14 Tage</SelectItem>
                    <SelectItem value="30">Letzte 30 Tage</SelectItem>
                    <SelectItem value="90">Letzte 90 Tage</SelectItem>
                    <SelectItem value="custom">Benutzerdefiniert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Current Date Range Display */}
              <div className="w-full sm:col-span-2 lg:col-span-1 xl:col-span-2">
                <Label className="mb-1 block">Aktueller Zeitraum</Label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-md flex-1 min-w-0">
                    <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">
                      {format(dateRange.start, "dd.MM.yyyy", { locale: de })} -{" "}
                      {format(dateRange.end, "dd.MM.yyyy", { locale: de })}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="flex-shrink-0"
                    onClick={() => fetchTimeEntries(filteredUserId)}
                    title="Aktualisieren"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Custom Date Range Picker */}
            {showCustomDatePicker && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 border-t">
                <div className="w-full">
                  <Label htmlFor="customStartDate" className="mb-1 block">
                    Startdatum
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="customStartDate"
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {customStartDate
                          ? format(customStartDate, "dd.MM.yyyy", { locale: de })
                          : "Datum wählen"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={customStartDate}
                        onSelect={setCustomStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="w-full">
                  <Label htmlFor="customEndDate" className="mb-1 block">
                    Enddatum
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="customEndDate"
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {customEndDate
                          ? format(customEndDate, "dd.MM.yyyy", { locale: de })
                          : "Datum wählen"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={customEndDate}
                        onSelect={setCustomEndDate}
                        initialFocus
                        disabled={(date) => (customStartDate && date < customStartDate) || date > new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="w-full flex items-end">
                  <Button
                    onClick={handleApplyCustomDateRange}
                    disabled={!customStartDate || !customEndDate}
                    className="w-full"
                  >
                    Anwenden
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-muted">
        <CardContent className="p-0 overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full" />
                <p className="text-muted-foreground">Lade Zeiteinträge...</p>
              </div>
            </div>
          ) : timeEntries.length > 0 ? (
            <div className="overflow-x-auto w-full">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/40">
                    <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                      Benutzer
                    </th>
                    <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                      Datum
                    </th>
                    <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                      Start
                    </th>
                    <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                      Ende
                    </th>
                    <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                      Dauer
                    </th>
                    <th className="text-right py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-muted-foreground w-[90px]">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {timeEntries
                    .map((entry) => {
                      const entryDate = new Date(entry.startTime);
                      const now = new Date();
                      // Skip future entries
                      if (entryDate > now) return null;

                      return (
                        <tr
                          key={entry.id}
                          className="border-b border-muted/60 hover:bg-muted/30 transition-colors"
                        >
                          <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium truncate max-w-[100px] sm:max-w-none">
                            {entry.user
                              ? entry.user.name
                              : getUserName(entry.userId)}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">
                            {(() => {
                              const start = new Date(entry.startTime);
                              const end = entry.endTime
                                ? new Date(entry.endTime)
                                : null;

                              // Check if it's a multi-day entry
                              const isMultiDay = end && !isSameDay(start, end);

                              if (isMultiDay) {
                                return (
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                                    <span className="whitespace-nowrap">
                                      {format(start, "dd.MM.yy", {
                                        locale: de,
                                      })}{" "}
                                      -{" "}
                                      {format(end, "dd.MM.yy", {
                                        locale: de,
                                      })}
                                    </span>
                                    <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full whitespace-nowrap inline-block w-fit">
                                      Mehrtägig
                                    </span>
                                  </div>
                                );
                              }

                              return format(start, "dd.MM.yyyy", {
                                locale: de,
                              });
                            })()}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">
                            {format(new Date(entry.startTime), "HH:mm", {
                              locale: de,
                            })}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">
                            {entry.endTime
                              ? format(new Date(entry.endTime), "HH:mm", {
                                  locale: de,
                                })
                              : "--:--"}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-mono">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                              <span>{formatTime(Number(entry.duration))}</span>
                              {entry.isBreak && (
                                <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 rounded-full whitespace-nowrap inline-block w-fit">
                                  Pause
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4 text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditTimeEntry(entry)}
                                className="h-7 w-7 sm:h-8 sm:w-8"
                              >
                                <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="sr-only">Bearbeiten</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  handleDeleteTimeEntryPrompt(entry)
                                }
                                className="h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                              >
                                <Trash className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="sr-only">Löschen</span>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                    .filter(Boolean)}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Clock className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Keine Aktivitäten verfügbar</p>
              <p className="text-muted-foreground mt-1">
                Für den gewählten Zeitraum wurden keine Zeiteinträge erfasst
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Time Entry Dialog */}
      <TimeEntryDialog
        open={timeEntryDialogOpen}
        onOpenChange={setTimeEntryDialogOpen}
        entry={editingTimeEntry}
        onSaved={() => fetchTimeEntries(filteredUserId)}
      />

      {/* Create Time Entry Dialog */}
      <CreateTimeEntryDialog
        open={createTimeEntryDialogOpen}
        onOpenChange={setCreateTimeEntryDialogOpen}
        onCreated={() => fetchTimeEntries(filteredUserId)}
      />

      {/* Delete Time Entry Dialog */}
      <DeleteTimeEntryDialog
        open={deleteTimeEntryDialogOpen}
        onOpenChange={setDeleteTimeEntryDialogOpen}
        entry={timeEntryToDelete}
        onDeleted={() => fetchTimeEntries(filteredUserId)}
      />
    </div>
  );
}
