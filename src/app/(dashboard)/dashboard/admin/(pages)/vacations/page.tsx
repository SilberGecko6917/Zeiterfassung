"use client";

import { useState, useEffect, useCallback } from "react";
import { useFormatting } from "@/hooks/useFormatting";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Check, X, UserPlus } from "lucide-react";
import { format, addDays } from "date-fns";
import { de } from "date-fns/locale";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User } from "@prisma/client";

interface VacationRequest {
  id: string;
  userId: string;
  userName: string;
  startDate: string;
  endDate: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestDate: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedDate?: string;
  rejectedBy?: string;
  rejectedByName?: string;
  rejectedDate?: string;
  comment?: string;
}

export default function VacationsPage() {
  const [vacations, setVacations] = useState<VacationRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [filterUserId, setFilterUserId] = useState<string | null>(null);

  // Create vacation dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newVacation, setNewVacation] = useState({
    userId: "",
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(addDays(new Date(), 7), "yyyy-MM-dd"),
    comment: "",
  });

  // Detail dialog
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedVacation, setSelectedVacation] =
    useState<VacationRequest | null>(null);

  const { formatDate, formatTime } = useFormatting();

  // Fetch vacations
  const fetchVacations = useCallback(async () => {
    try {
      setIsLoading(true);
      // Changed from "/api/admin/vacations" to "/api/admin/vacation"
      const response = await fetch("/api/admin/vacation");
      const data = await response.json();

      console.log("API Response:", data); // Debug logging

      // Transform the data to match expected format
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transformedVacations = data.vacations.map((vacation: any) => ({
        id: vacation.id.toString(),
        userId: vacation.userId,
        userName: vacation.user?.name || "Unknown",
        startDate: vacation.startDate,
        endDate: vacation.endDate,
        status: vacation.status.toUpperCase(),
        requestDate: vacation.createdAt,
        comment: vacation.description,
        // Add other fields if they exist in your API response
        approvedBy: vacation.approvedBy || undefined,
        approvedByName: vacation.approvedByName || undefined,
        approvedDate: vacation.approvedDate || undefined,
        rejectedBy: vacation.rejectedBy || undefined,
        rejectedByName: vacation.rejectedByName || undefined,
        rejectedDate: vacation.rejectedDate || undefined,
      }));

      setVacations(transformedVacations);
    } catch (error) {
      console.error("Failed to fetch vacations:", error);
      toast.error("Fehler beim Laden der Urlaubsanträge");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/users");
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    fetchVacations();
    fetchUsers();
  }, [fetchVacations, fetchUsers]);

  // Approve vacation - use existing PUT endpoint
  const handleApproveVacation = async (id: string) => {
    try {
      setIsLoading(true);
      // Use the existing PUT endpoint with status="approved"
      const response = await fetch(`/api/admin/vacation/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "approved" }),
      });

      if (!response.ok) {
        throw new Error("Failed to approve vacation");
      }

      toast.success("Urlaubsantrag genehmigt");
      fetchVacations();
      window.dispatchEvent(new Event('vacationStatusUpdated'));
    } catch (error) {
      console.error("Failed to approve vacation:", error);
      toast.error("Fehler beim Genehmigen des Urlaubsantrags");
    } finally {
      setIsLoading(false);
    }
  };

  // Reject vacation - use existing PUT endpoint
  const handleRejectVacation = async (id: string) => {
    try {
      setIsLoading(true);
      // Use the existing PUT endpoint with status="rejected"
      const response = await fetch(`/api/admin/vacation/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "rejected" }),
      });

      if (!response.ok) {
        throw new Error("Failed to reject vacation");
      }

      toast.success("Urlaubsantrag abgelehnt");
      fetchVacations();
      window.dispatchEvent(new Event('vacationStatusUpdated'));
    } catch (error) {
      console.error("Failed to reject vacation:", error);
      toast.error("Fehler beim Ablehnen des Urlaubsantrags");
    } finally {
      setIsLoading(false);
    }
  };

  // Create vacation
  const handleCreateVacation = async () => {
    try {
      setIsLoading(true);

      // Changed to use singular "vacation"
      const response = await fetch("/api/admin/vacation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: newVacation.userId,
          startDate: newVacation.startDate,
          endDate: newVacation.endDate,
          description: newVacation.comment, // Using the field name from your API
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create vacation");
      }

      toast.success("Urlaubsantrag erstellt");
      setCreateDialogOpen(false);
      fetchVacations();

      // Reset form
      setNewVacation({
        userId: "",
        startDate: format(new Date(), "yyyy-MM-dd"),
        endDate: format(addDays(new Date(), 7), "yyyy-MM-dd"),
        comment: "",
      });
    } catch (error) {
      console.error("Failed to create vacation:", error);
      toast.error("Fehler beim Erstellen des Urlaubsantrags");
    } finally {
      setIsLoading(false);
    }
  };

  // Show vacation details
  const handleShowDetails = (vacation: VacationRequest) => {
    setSelectedVacation(vacation);
    setDetailDialogOpen(true);
  };

  // Calculate vacation days (only workdays Monday-Friday)
  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Calculate the number of days between start & end (Mo-Fr)
    let days = 0;
    const current = new Date(start);

    while (current <= end) {
      const dayOfWeek = current.getDay();
      // Only count weekdays (1-5 = Monday to Friday)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        days++;
      }
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  // Filter vacations based on tab and user filter
  const filteredVacations = vacations.filter((vacation) => {
    if (activeTab === "pending" && vacation.status !== "PENDING") return false;
    if (activeTab === "approved" && vacation.status !== "APPROVED")
      return false;
    if (activeTab === "rejected" && vacation.status !== "REJECTED")
      return false;
    if (filterUserId && vacation.userId !== filterUserId) return false;
    return true;
  });

  if (isLoading && vacations.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full" />
          <p className="text-muted-foreground">Lade Urlaubsanträge...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Urlaubsverwaltung
          </h1>
          <p className="text-muted-foreground mt-2">
            Urlaubsanträge einsehen und genehmigen
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Urlaub erstellen
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Urlaubsanträge</CardTitle>
            <div className="flex items-center gap-2">
              <Select
                value={filterUserId || "all"}
                onValueChange={(value) =>
                  setFilterUserId(value === "all" ? null : value)
                }
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Alle Mitarbeiter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Mitarbeiter</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {filterUserId && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setFilterUserId(null)}
                  title="Filter entfernen"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs
            defaultValue="pending"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="mb-4 grid grid-cols-3">
              <TabsTrigger value="pending">Ausstehend</TabsTrigger>
              <TabsTrigger value="approved">Genehmigt</TabsTrigger>
              <TabsTrigger value="rejected">Abgelehnt</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              {filteredVacations.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                          Mitarbeiter
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                          Zeitraum
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                          Tage
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                          Status
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                          Aktionen
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredVacations.map((vacation) => (
                        <tr
                          key={vacation.id}
                          className="border-b border-muted/60 hover:bg-muted/30 cursor-pointer"
                          onClick={() => handleShowDetails(vacation)}
                        >
                          <td className="py-3 px-4">{vacation.userName}</td>
                          <td className="py-3 px-4">
                            {formatDate(vacation.startDate)} -{" "}
                            {formatDate(vacation.endDate)}
                          </td>
                          <td className="py-3 px-4">
                            {calculateDays(
                              vacation.startDate,
                              vacation.endDate
                            )}{" "}
                            Tage
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                vacation.status === "APPROVED"
                                  ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : vacation.status === "REJECTED"
                                  ? "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                  : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                              }`}
                            >
                              {vacation.status === "APPROVED"
                                ? "Genehmigt"
                                : vacation.status === "REJECTED"
                                ? "Abgelehnt"
                                : "Ausstehend"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApproveVacation(vacation.id);
                                }}
                              >
                                <Check className="h-4 w-4" />
                                <span className="sr-only">Genehmigen</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRejectVacation(vacation.id);
                                }}
                              >
                                <X className="h-4 w-4" />
                                <span className="sr-only">Ablehnen</span>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">
                    Keine ausstehenden Urlaubsanträge
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    Alle Urlaubsanträge wurden bearbeitet.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="approved" className="space-y-4">
              {filteredVacations.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                          Mitarbeiter
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                          Zeitraum
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                          Tage
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                          Genehmigt von
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredVacations.map((vacation) => (
                        <tr
                          key={vacation.id}
                          className="border-b border-muted/60 hover:bg-muted/30 cursor-pointer"
                          onClick={() => handleShowDetails(vacation)}
                        >
                          <td className="py-3 px-4">{vacation.userName}</td>
                          <td className="py-3 px-4">
                            {formatDate(vacation.startDate)} -{" "}
                            {formatDate(vacation.endDate)}
                          </td>
                          <td className="py-3 px-4">
                            {calculateDays(
                              vacation.startDate,
                              vacation.endDate
                            )}{" "}
                            Tage
                          </td>
                          <td className="py-3 px-4">
                            {vacation.approvedByName || "System"}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                vacation.status === "APPROVED"
                                  ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : vacation.status === "REJECTED"
                                  ? "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                  : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                              }`}
                            >
                              {vacation.status === "APPROVED"
                                ? "Genehmigt"
                                : vacation.status === "REJECTED"
                                ? "Abgelehnt"
                                : "Ausstehend"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">
                    Keine genehmigten Urlaubsanträge
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    Es wurden noch keine Urlaubsanträge genehmigt.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="rejected" className="space-y-4">
              {filteredVacations.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                          Mitarbeiter
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                          Zeitraum
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                          Tage
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                          Abgelehnt von
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredVacations.map((vacation) => (
                        <tr
                          key={vacation.id}
                          className="border-b border-muted/60 hover:bg-muted/30 cursor-pointer"
                          onClick={() => handleShowDetails(vacation)}
                        >
                          <td className="py-3 px-4">{vacation.userName}</td>
                          <td className="py-3 px-4">
                            {formatDate(vacation.startDate)} -{" "}
                            {formatDate(vacation.endDate)}
                          </td>
                          <td className="py-3 px-4">
                            {calculateDays(
                              vacation.startDate,
                              vacation.endDate
                            )}{" "}
                            Tage
                          </td>
                          <td className="py-3 px-4">
                            {vacation.rejectedByName || "System"}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                vacation.status === "APPROVED"
                                  ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : vacation.status === "REJECTED"
                                  ? "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                  : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                              }`}
                            >
                              {vacation.status === "APPROVED"
                                ? "Genehmigt"
                                : vacation.status === "REJECTED"
                                ? "Abgelehnt"
                                : "Ausstehend"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <X className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">
                    Keine abgelehnten Urlaubsanträge
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    Es wurden noch keine Urlaubsanträge abgelehnt.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create Vacation Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Neuen Urlaub erstellen</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="userId">Mitarbeiter</Label>
              <Select
                value={newVacation.userId}
                onValueChange={(value) =>
                  setNewVacation({ ...newVacation, userId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Mitarbeiter auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Startdatum</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={newVacation.startDate}
                  onChange={(e) =>
                    setNewVacation({
                      ...newVacation,
                      startDate: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">Enddatum</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={newVacation.endDate}
                  onChange={(e) =>
                    setNewVacation({ ...newVacation, endDate: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="comment">Kommentar (optional)</Label>
              <Input
                id="comment"
                value={newVacation.comment}
                onChange={(e) =>
                  setNewVacation({ ...newVacation, comment: e.target.value })
                }
                placeholder="Urlaubsgrund oder sonstige Hinweise"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleCreateVacation}
              disabled={
                !newVacation.userId ||
                !newVacation.startDate ||
                !newVacation.endDate
              }
            >
              Urlaub erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Vacation Details Dialog */}
      {selectedVacation && (
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Urlaubsdetails</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="font-medium">Mitarbeiter:</div>
                <div className="col-span-2">{selectedVacation.userName}</div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="font-medium">Zeitraum:</div>
                <div className="col-span-2">
                  {formatDate(selectedVacation.startDate)} -{" "}
                  {formatDate(selectedVacation.endDate)}
                  <div className="text-sm text-muted-foreground mt-1">
                    {calculateDays(
                      selectedVacation.startDate,
                      selectedVacation.endDate
                    )}{" "}
                    Tage
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="font-medium">Status:</div>
                <div className="col-span-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      selectedVacation.status === "APPROVED"
                        ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : selectedVacation.status === "REJECTED"
                        ? "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    }`}
                  >
                    {selectedVacation.status === "APPROVED"
                      ? "Genehmigt"
                      : selectedVacation.status === "REJECTED"
                      ? "Abgelehnt"
                      : "Ausstehend"}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="font-medium">Beantragt am:</div>
                <div className="col-span-2">
                  {formatDate(selectedVacation.requestDate)}{" "}
                  {formatTime(selectedVacation.requestDate)}
                </div>
              </div>
              {selectedVacation.approvedByName && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="font-medium">Genehmigt von:</div>
                  <div className="col-span-2">
                    {selectedVacation.approvedByName}
                    {selectedVacation.approvedDate && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {format(
                          new Date(selectedVacation.approvedDate),
                          "dd.MM.yyyy HH:mm",
                          {
                            locale: de,
                          }
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {selectedVacation.rejectedByName && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="font-medium">Abgelehnt von:</div>
                  <div className="col-span-2">
                    {selectedVacation.rejectedByName}
                    {selectedVacation.rejectedDate && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {format(
                          new Date(selectedVacation.rejectedDate),
                          "dd.MM.yyyy HH:mm",
                          {
                            locale: de,
                          }
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {selectedVacation.comment && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="font-medium">Kommentar:</div>
                  <div className="col-span-2">{selectedVacation.comment}</div>
                </div>
              )}
            </div>
            <DialogFooter>
              {selectedVacation.status === "PENDING" && (
                <>
                  <Button
                    variant="outline"
                    className="mr-2"
                    onClick={() => {
                      handleRejectVacation(selectedVacation.id);
                      setDetailDialogOpen(false);
                    }}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Ablehnen
                  </Button>
                  <Button
                    onClick={() => {
                      handleApproveVacation(selectedVacation.id);
                      setDetailDialogOpen(false);
                    }}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Genehmigen
                  </Button>
                </>
              )}
              {selectedVacation.status !== "PENDING" && (
                <Button onClick={() => setDetailDialogOpen(false)}>
                  Schließen
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
