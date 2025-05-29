"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Edit, Trash, X, RefreshCw } from "lucide-react";
import { format, subDays, isSameDay } from "date-fns";
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
    fetchTimeEntries,
    deleteTimeEntry,
    filterByUser,
    clearFilter,
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
  }, [searchParams]); // Reduced dependency array

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

  // Delete time entry
  const handleDeleteTimeEntry = async () => {
    if (!timeEntryToDelete) return;

    try {
      await deleteTimeEntry(timeEntryToDelete.id.toString());
      setDeleteTimeEntryDialogOpen(false);
    } catch (error) {
      console.error("Failed to delete time entry:", error);
    }
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
              ? `Aktivitäten von ${filteredUserName} (letzte 7 Tage)`
              : "Aktivitäten der letzten 7 Tage"}
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
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="w-full sm:w-72">
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
                      // Update URL to reflect filter
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

            <div className="flex-1">
              <Label htmlFor="dateRangeFilter" className="mb-1 block">
                Zeitraum
              </Label>
              <div className="flex items-center gap-2">
                <div className="flex items-center text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-md w-full truncate">
                  <Calendar className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span className="truncate">
                    {format(subDays(new Date(), 7), "dd.MM.yyyy", {
                      locale: de,
                    })}{" "}
                    - {format(new Date(), "dd.MM.yyyy", { locale: de })}
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
                Für die letzten 7 Tage wurden keine Zeiteinträge erfasst
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
