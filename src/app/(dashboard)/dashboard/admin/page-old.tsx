"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { checkIsAdmin } from "@/lib/server/auth-actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, subDays, isSameDay } from "date-fns";
import { de } from "date-fns/locale";
import {
  User,
  Clock,
  Edit,
  Trash,
  Check,
  X,
  Search,
  UserPlus,
  Calendar,
  Info,
  LayoutDashboard,
  Users,
  ClipboardList,
  LogOut,
  PieChart,
  Download,
  Coffee,
  Save,
  CalendarCheck,
  CalendarX,
  Eye,
  Settings,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { UserData, TimeEntry, DashboardStats, VacationData, Setting } from "@/types/dashboard";
import { Switch } from "@/components/ui/switch";
import { SETTINGS } from "@/lib/constants";

interface BreakSetting {
  userId: string;
  breakDuration: number;
  autoInsert: boolean;
}

export default function AdminDashboard() {
  const { status } = useSession();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [users, setUsers] = useState<UserData[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeTracking: 0,
    todayMinutesWorked: 0,
    weeklyHours: 0,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<Setting[]>([]);

  // User creation/edit dialog
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER",
  });

  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);

  // Time entry dialog
  const [timeEntryDialogOpen, setTimeEntryDialogOpen] = useState(false);
  const [editingTimeEntry, setEditingTimeEntry] = useState<TimeEntry | null>(
    null
  );
  const [timeEntryForm, setTimeEntryForm] = useState({
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
  });

  const [createTimeEntryDialogOpen, setCreateTimeEntryDialogOpen] =
    useState(false);
  const [newTimeEntryForm, setNewTimeEntryForm] = useState({
    userId: "",
    startDate: format(new Date(), "yyyy-MM-dd"),
    startTime: format(new Date(), "HH:mm"),
    endDate: format(new Date(), "yyyy-MM-dd"),
    endTime: format(new Date(Date.now() + 60 * 60 * 1000), "HH:mm"),
  });

  // Fetch logs
  const [logs, setLogs] = useState<any[]>([]);

  const [filteredUserId, setFilteredUserId] = useState<string | null>(null);
  const [filteredUserName, setFilteredUserName] = useState<string | null>(null);

  const [logDetailsOpen, setLogDetailsOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  // States for Export
  const [exportPeriod, setExportPeriod] = useState<"day" | "month" | "year">(
    "month"
  );
  const [exportUserId, setExportUserId] = useState<string>("all");
  const [exportLoading, setExportLoading] = useState(false);

  const [usersWithBreakSettings, setUsersWithBreakSettings] = useState<
    (UserData & { breakSettings?: BreakSetting })[]
  >([]);

  // States for Vacations
  const [vacations, setVacations] = useState<Array<VacationData & { user?: UserData }>>([]);
  const [selectedVacation, setSelectedVacation] = useState<(VacationData & { user?: UserData }) | null>(null);
  const [vacationDetailsOpen, setVacationDetailsOpen] = useState(false);

  // Export Funktion
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
        throw new Error("Export fehlgeschlagen");
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
      toast.error("Fehler beim Erstellen des Exports");
    } finally {
      setExportLoading(false);
    }
  };

  // Format time as HH:MM:SS
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Format minutes as readable time
  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Check admin status
  useEffect(() => {
    const verifyAccess = async () => {
      if (status === "unauthenticated") {
        router.push("/login");
        return;
      }

      if (status === "authenticated") {
        try {
          const isAdminResult = await checkIsAdmin();

          if (!isAdminResult) {
            router.push("/dashboard");
          }

          setIsAdmin(isAdminResult);
          setIsLoading(false);
        } catch (error) {
          console.error("Error checking admin access:", error);
          router.push("/dashboard");
        }
      }
    };

    if (status !== "loading") {
      verifyAccess();
    }
  }, [status, router]);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/users");
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Fehler beim Laden der Benutzer");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch time entries for the last 7 days
  const fetchTimeEntries = useCallback(async () => {
    try {
      setIsLoading(true);
      const endDate = new Date();
      const startDate = subDays(endDate, 7);

      let url = `/api/admin/time-entries?startDate=${format(
        startDate,
        "yyyy-MM-dd"
      )}&endDate=${format(endDate, "yyyy-MM-dd")}`;

      // Filter by user if userId is set
      if (filteredUserId) {
        url += `&userId=${filteredUserId}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      setTimeEntries(data.entries || []);

      if (filteredUserId) {
        toast.success(
          `Zeiteinträge für ${filteredUserName || "Benutzer"} geladen`
        );
      } else {
        toast.success("Zeiteinträge aktualisiert");
      }
    } catch (error) {
      console.error("Failed to fetch time entries:", error);
      toast.error("Fehler beim Laden der Zeiteinträge");
    } finally {
      setIsLoading(false);
    }
  }, [filteredUserId, filteredUserName]);

  // Fetch dashboard statistics
  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/stats");
      const data = await response.json();
      setStats({
        totalUsers: data.totalUsers || 0,
        activeTracking: data.activeTracking || 0,
        todayMinutesWorked: data.todayMinutesWorked || 0,
        weeklyHours: data.weeklyHours || 0,
        upcomingVacations: data.upcomingVacations || [],
      });
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
      toast.error("Fehler beim Laden der Dashboard-Statistiken");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBreakSettings = async () => {
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
  };

  const fetchVacations = async () => {
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
  };

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/settings");
      
      if (!response.ok) {
        throw new Error("Failed to fetch settings");
      }
      
      const data = await response.json();
      
      // Merge fetched settings with definitions
      const mergedSettings = SETTINGS.map(def => {
        const existingSetting = data.settings.find((s: any) => s.key === def.key);
        return {
          ...def,
          value: existingSetting ? existingSetting.value : def.value,
          description: existingSetting?.description || def.description
        };
      });
      
      setSettings(mergedSettings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Fehler beim Laden der Einstellungen");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVacationStatusChange = async (id: number, newStatus: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/vacation/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update vacation status");
      }
      
      // Update local state
      setVacationDetailsOpen(false);
      fetchVacations();
      
      toast.success(`Urlaubsantrag ${
        newStatus === "approved" ? "genehmigt" : "abgelehnt"
      }`);
    } catch (error) {
      console.error("Error updating vacation status:", error);
      toast.error("Fehler beim Aktualisieren des Urlaubsstatus");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewVacationDetails = (vacation: VacationData & { user?: UserData }) => {
    setSelectedVacation(vacation);
    setVacationDetailsOpen(true);
  };

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      
      const settingsToSave = settings.map(setting => ({
        key: setting.key,
        value: setting.value,
        description: setting.description
      }));
      
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ settings: settingsToSave }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to save settings");
      }
      
      toast.success("Einstellungen erfolgreich gespeichert");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Fehler beim Speichern der Einstellungen");
    } finally {
      setIsSaving(false);
    }
  };

  // Load data based on active section
  useEffect(() => {
    if (isAdmin) {
      if (activeSection === "users") {
        fetchUsers();
      } else if (activeSection === "activities") {
        fetchTimeEntries();
      } else if (activeSection === "dashboard") {
        fetchDashboardStats();
        fetchUsers();
        fetchTimeEntries();
        fetchVacations();
      } else if (activeSection === "logs") {
        fetchLogs();
      } else if (activeSection === "breaks") {
        fetchBreakSettings();
      } else if (activeSection === "vacations") {
        fetchVacations();
      } else if (activeSection === "settings") {
        fetchSettings();
      }
    }
  }, [isAdmin, activeSection, fetchTimeEntries, fetchUsers]);

  useEffect(() => {
    if (activeSection === "activities") {
      fetchTimeEntries();
    }
  }, [filteredUserId, activeSection, fetchTimeEntries]);

  useEffect(() => {
    if (isAdmin) {
      if (activeSection === "users") {
        fetchUsers();
      } else if (activeSection === "activities") {
        fetchTimeEntries();
      } else if (activeSection === "dashboard") {
        fetchDashboardStats();
        fetchUsers();
        fetchTimeEntries();
      } else if (activeSection === "logs") {
        fetchLogs();
      } else if (activeSection === "breaks") {
        fetchBreakSettings();
      }
    }
  }, [isAdmin, activeSection, fetchTimeEntries, fetchUsers]);

  // Open create user dialog
  const handleCreateUser = () => {
    setIsEditing(false);
    setNewUser({
      name: "",
      email: "",
      password: "",
      role: "USER",
    });
    setUserDialogOpen(true);
  };

  // Open edit user dialog
  const handleEditUser = (user: UserData) => {
    setIsEditing(true);
    setSelectedUser(user);
    setNewUser({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
    });
    setUserDialogOpen(true);
  };

  // Open delete confirmation dialog
  const handleDeletePrompt = (user: UserData) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  // Display user activities
  const handleViewUserActivities = async (userId: string, userName: string) => {
    // Set the filtered user ID and name
    setFilteredUserId(userId);
    setFilteredUserName(userName);

    // Set the active section to activities
    setActiveSection("activities");

    // Fetch time entries for the selected user
    try {
      setIsLoading(true);
      const endDate = new Date();
      const startDate = subDays(endDate, 7);

      const url = `/api/admin/time-entries?startDate=${format(
        startDate,
        "yyyy-MM-dd"
      )}&endDate=${format(endDate, "yyyy-MM-dd")}&userId=${userId}`;

      const response = await fetch(url);
      const data = await response.json();
      setTimeEntries(data.entries || []);
    } catch (error) {
      console.error("Failed to fetch time entries:", error);
      toast.error("Fehler beim Laden der Zeiteinträge");
    } finally {
      setIsLoading(false);
    }
  };

  // Save user (create or update)
  const handleSaveUser = async () => {
    try {
      setIsLoading(true);

      if (isEditing && selectedUser) {
        // Update existing user
        const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: newUser.name,
            email: newUser.email,
            role: newUser.role.toUpperCase(),
            ...(newUser.password ? { password: newUser.password } : {}),
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to update user");
        }

        toast.success("Benutzer aktualisiert");
      } else {
        // Create new user
        const response = await fetch("/api/admin/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newUser),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to create user");
        }

        toast.success("Benutzer erstellt");
      }

      setUserDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Fehler beim Speichern des Benutzers");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete user
  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete user");
      }

      toast.success("Benutzer gelöscht");
      setDeleteDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Fehler beim Löschen des Benutzers");
    } finally {
      setIsLoading(false);
    }
  };

  // Open time entry edit dialog
  const handleEditTimeEntry = (entry: TimeEntry) => {
    const startDate = new Date(entry.startTime);
    const endDate = new Date(entry.endTime);

    setEditingTimeEntry(entry);
    setTimeEntryForm({
      startDate: format(startDate, "yyyy-MM-dd"),
      startTime: format(startDate, "HH:mm"),
      endDate: format(endDate, "yyyy-MM-dd"),
      endTime: format(endDate, "HH:mm"),
    });
    setTimeEntryDialogOpen(true);
  };

  // Save edited time entry
  const handleSaveTimeEntry = async () => {
    if (!editingTimeEntry) return;

    try {
      setIsLoading(true);

      // Create full datetime strings
      const startDateTime = `${timeEntryForm.startDate}T${timeEntryForm.startTime}:00`;
      const endDateTime = `${timeEntryForm.endDate}T${timeEntryForm.endTime}:00`;

      // Calculate duration in seconds
      const start = new Date(startDateTime);
      const end = new Date(endDateTime);
      const durationSeconds = Math.floor(
        (end.getTime() - start.getTime()) / 1000
      );

      if (durationSeconds < 0) {
        throw new Error("End time must be after start time");
      }

      // Send update to API
      const response = await fetch(
        `/api/admin/time-entries/${editingTimeEntry.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            startTime: startDateTime,
            endTime: endDateTime,
            duration: durationSeconds,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update time entry");
      }

      toast.success("Zeiteintrag aktualisiert");
      setTimeEntryDialogOpen(false);
      fetchTimeEntries();
    } catch (error: any) {
      toast.error(error.message || "Fehler beim Speichern des Zeiteintrags");
    } finally {
      setIsLoading(false);
    }
  };

  // Open create time entry dialog
  const handleCreateTimeEntry = () => {
    setNewTimeEntryForm({
      userId: "",
      startDate: format(new Date(), "yyyy-MM-dd"),
      startTime: format(new Date(), "HH:mm"),
      endDate: format(new Date(), "yyyy-MM-dd"),
      endTime: format(new Date(Date.now() + 60 * 60 * 1000), "HH:mm"),
    });
    setCreateTimeEntryDialogOpen(true);
  };

  // Save new time entry
  const handleSaveNewTimeEntry = async () => {
    try {
      setIsLoading(true);

      if (!newTimeEntryForm.userId) {
        throw new Error("Bitte einen Benutzer auswählen");
      }

      // Create full datetime strings
      const startDateTime = `${newTimeEntryForm.startDate}T${newTimeEntryForm.startTime}:00`;
      const endDateTime = `${newTimeEntryForm.endDate}T${newTimeEntryForm.endTime}:00`;

      // Calculate duration in seconds
      const start = new Date(startDateTime);
      const end = new Date(endDateTime);
      const durationSeconds = Math.floor(
        (end.getTime() - start.getTime()) / 1000
      );

      if (durationSeconds < 0) {
        throw new Error("Endzeit muss nach Startzeit liegen");
      }

      // Send creation to API
      const response = await fetch("/api/admin/time-entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: newTimeEntryForm.userId,
          startTime: startDateTime,
          endTime: endDateTime,
          duration: durationSeconds,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create time entry");
      }

      toast.success("Zeiteintrag erstellt");
      setCreateTimeEntryDialogOpen(false);
      fetchTimeEntries();
    } catch (error: any) {
      toast.error(error.message || "Fehler beim Erstellen des Zeiteintrags");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveBreakSettings = async (
    userId: string,
    breakDuration: number,
    autoInsert: boolean
  ) => {
    try {
      const response = await fetch("/api/admin/break-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, breakDuration, autoInsert }),
      });

      if (!response.ok) {
        throw new Error("Failed to save break settings");
      }

      toast.success("Pauseneinstellungen gespeichert");
      fetchBreakSettings();
    } catch {
      toast.error("Fehler beim Speichern der Pauseneinstellungen");
    }
  };

  // Delete time entry
  const [deleteTimeEntryDialogOpen, setDeleteTimeEntryDialogOpen] =
    useState(false);
  const [timeEntryToDelete, setTimeEntryToDelete] = useState<TimeEntry | null>(
    null
  );

  // Open delete time entry prompt
  const handleDeleteTimeEntryPrompt = (entry: TimeEntry) => {
    setTimeEntryToDelete(entry);
    setDeleteTimeEntryDialogOpen(true);
  };

  // Delete time entry
  const handleDeleteTimeEntry = async () => {
    if (!timeEntryToDelete) return;

    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/admin/time-entries/${timeEntryToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete time entry");
      }

      toast.success("Zeiteintrag gelöscht");
      setDeleteTimeEntryDialogOpen(false);
      fetchTimeEntries();
    } catch (error: any) {
      toast.error(error.message || "Fehler beim Löschen des Zeiteintrags");
    } finally {
      setIsLoading(false);
    }
  };

  // Load logs
  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/logs?days=7&formated=true");
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

  const handleViewLogDetails = (log: any) => {
    setSelectedLog(log);
    setLogDetailsOpen(true);
  };

  const updateSetting = (key: string, value: string) => {
    setSettings(prev => 
      prev.map(setting => 
        setting.key === key ? { ...setting, value } : setting
      )
    );
  };

  // Filter users based on search term
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Admin check failed
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="flex bg-muted/30 w-full h-full">
      {/* Sidebar */}
      <aside className="w-64 bg-background border-r border-border/50 hidden md:block fixed left-0 top-0 bottom-0 z-10">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold">Admin Panel</h2>
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => setActiveSection("dashboard")}
                className={`flex items-center w-full px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                  activeSection === "dashboard"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                <LayoutDashboard className="mr-3 h-5 w-5" />
                Dashboard
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveSection("users")}
                className={`flex items-center w-full px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                  activeSection === "users"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                <Users className="mr-3 h-5 w-5" />
                Benutzer
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveSection("activities")}
                className={`flex items-center w-full px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                  activeSection === "activities"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                <ClipboardList className="mr-3 h-5 w-5" />
                Aktivitäten
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveSection("logs")}
                className={`flex items-center w-full px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                  activeSection === "logs"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                <Info className="mr-3 h-5 w-5" />
                Logs
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveSection("breaks")}
                className={`flex items-center w-full px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                  activeSection === "breaks"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                <Coffee className="mr-3 h-5 w-5" />
                Pausen
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveSection("export")}
                className={`flex items-center w-full px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                  activeSection === "export"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                <Download className="mr-3 h-5 w-5" />
                Export
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveSection("vacations")}
                className={`flex items-center w-full px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                  activeSection === "vacations"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                <Calendar className="mr-3 h-5 w-5" />
                Urlaubsanträge
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveSection("settings")}
                className={`flex items-center w-full px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                  activeSection === "settings"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                <Settings className="mr-3 h-5 w-5" />
                Einstellungen
              </button>
            </li>
          </ul>
        </nav>
        <div className="border-t mt-auto absolute bottom-0 left-0 right-0 w-full">
          <Link href="/dashboard" className="w-full block">
            <Button
              variant="outline"
              className="w-full rounded-none border-0 h-15 flex items-center justify-center"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Zurück
            </Button>
          </Link>
        </div>
      </aside>

      {/* Mobile Nav */}
      <div className="md:hidden w-full fixed top-0 left-0 z-10 bg-background border-b border-border/50">
        <div className="flex items-center justify-between p-4">
          <h2 className="font-bold">Admin Panel</h2>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={activeSection === "dashboard" ? "default" : "ghost"}
              onClick={() => setActiveSection("dashboard")}
            >
              <LayoutDashboard className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={activeSection === "users" ? "default" : "ghost"}
              onClick={() => setActiveSection("users")}
            >
              <Users className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={activeSection === "activities" ? "default" : "ghost"}
              onClick={() => setActiveSection("activities")}
            >
              <ClipboardList className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={activeSection === "logs" ? "default" : "ghost"}
              onClick={() => setActiveSection("logs")}
            >
              <Info className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={activeSection === "breaks" ? "default" : "ghost"}
              onClick={() => setActiveSection("breaks")}
            >
              <Coffee className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={activeSection === "export" ? "default" : "ghost"}
              onClick={() => setActiveSection("export")}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={activeSection === "vacations" ? "default" : "ghost"}
              onClick={() => setActiveSection("vacations")}
            >
              <Calendar className="h-4 w-4" />
            </Button>
            <Link href="/dashboard">
              <Button size="sm" variant="outline">
                <LogOut className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 w-full md:ml-64 min-h-screen">
        <div className="p-6 md:p-10 pt-16 md:pt-10">
          {/* Dashboard Section */}
          {activeSection === "dashboard" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground mt-2">
                  Übersicht und Statistiken der Zeiterfassung
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {/* Total Users Card */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Benutzer gesamt
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-3xl font-bold">{users.length}</div>
                      <div className="p-2 bg-blue-100 text-blue-700 rounded-full dark:bg-blue-900/30 dark:text-blue-400">
                        <Users className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Active Tracking Card */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Aktive Erfassungen
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-3xl font-bold">
                        {stats.activeTracking}
                      </div>
                      <div className="p-2 bg-green-100 text-green-700 rounded-full dark:bg-green-900/30 dark:text-green-400">
                        <Clock className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Today's Work Hours */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Arbeitszeit heute
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-3xl font-bold">
                        {formatMinutes(stats.todayMinutesWorked)}
                      </div>
                      <div className="p-2 bg-purple-100 text-purple-700 rounded-full dark:bg-purple-900/30 dark:text-purple-400">
                        <Calendar className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Weekly Work Hours */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Wöchentliche Stunden
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-3xl font-bold">
                        {stats.weeklyHours.toFixed(1)}h
                      </div>
                      <div className="p-2 bg-amber-100 text-amber-700 rounded-full dark:bg-amber-900/30 dark:text-amber-400">
                        <PieChart className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activities */}
              <Card>
                <CardHeader>
                  <CardTitle>Letzte Aktivitäten</CardTitle>
                  <CardDescription>
                    Die neuesten Zeiterfassungen aller Benutzer
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {timeEntries.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                              Benutzer
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                              Datum
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                              Zeit
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                              Dauer
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {timeEntries.slice(0, 5).map((entry) => (
                            <tr
                              key={entry.id}
                              className="border-b border-muted/60 hover:bg-muted/30"
                            >
                              <td className="py-3 px-4">{entry.userName}</td>
                              <td className="py-3 px-4">
                                {format(
                                  new Date(entry.startTime),
                                  "dd.MM.yyyy",
                                  { locale: de }
                                )}
                              </td>
                              <td className="py-3 px-4">
                                {format(new Date(entry.startTime), "HH:mm", {
                                  locale: de,
                                })}{" "}
                                -{" "}
                                {format(new Date(entry.endTime), "HH:mm", {
                                  locale: de,
                                })}
                              </td>
                              <td className="py-3 px-4 font-mono">
                                {formatTime(entry.duration)}
                                {entry.isBreak && (
                                  <span className="ml-2 text-xs px-1.5 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 rounded-full">
                                    Pause
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      Keine Aktivitäten in den letzten 7 Tagen
                    </div>
                  )}
                </CardContent>
                <CardFooter className="border-t bg-muted/50 py-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveSection("activities")}
                    className="ml-auto"
                  >
                    Alle anzeigen
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="ml-2 h-4 w-4"
                    >
                      <path d="M9 6l6 6-6 6"></path>
                    </svg>
                  </Button>
                </CardFooter>
              </Card>

              {/* User Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Benutzerübersicht</CardTitle>
                  <CardDescription>
                    Alle registrierten Benutzer und ihre Rollen
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {users.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                              Name
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                              E-Mail
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                              Rolle
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.slice(0, 5).map((user) => (
                            <tr
                              key={user.id}
                              className="border-b border-muted/60 hover:bg-muted/30"
                            >
                              <td className="py-3 px-4 font-medium">
                                {user.name}
                              </td>
                              <td className="py-3 px-4">{user.email}</td>
                              <td className="py-3 px-4">
                                <span
                                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                    user.role === "ADMIN"
                                      ? "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                      : user.role === "MANAGER"
                                      ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                      : "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                  }`}
                                >
                                  {user.role === "ADMIN"
                                    ? "Admin"
                                    : user.role === "MANAGER"
                                    ? "Manager"
                                    : "Benutzer"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      Keine Benutzer vorhanden
                    </div>
                  )}
                </CardContent>
                <CardFooter className="border-t bg-muted/50 py-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveSection("users")}
                    className="ml-auto"
                  >
                    Alle anzeigen
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="ml-2 h-4 w-4"
                    >
                      <path d="M9 6l6 6-6 6"></path>
                    </svg>
                  </Button>
                </CardFooter>
              </Card>
              {/* Upcoming Vacations */}
              <Card>
                <CardHeader>
                  <CardTitle>Kommende Urlaube</CardTitle>
                  <CardDescription>
                    Genehmigte Urlaube der nächsten 30 Tage
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {stats.upcomingVacations && stats.upcomingVacations.length > 0 ? (
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
                          </tr>
                        </thead>
                        <tbody>
                          {stats.upcomingVacations.slice(0, 5).map((vacation) => (
                            <tr
                              key={vacation.id}
                              className="border-b border-muted/60 hover:bg-muted/30"
                            >
                              <td className="py-3 px-4">{vacation.userName}</td>
                              <td className="py-3 px-4">
                                {format(new Date(vacation.startDate), "dd.MM.yyyy", { locale: de })} -<br />
                                {format(new Date(vacation.endDate), "dd.MM.yyyy", { locale: de })}
                              </td>
                              <td className="py-3 px-4">{vacation.days} Tage</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      Keine kommenden Urlaube in den nächsten 30 Tagen
                    </div>
                  )}
                </CardContent>
                <CardFooter className="border-t bg-muted/50 py-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveSection("vacations")}
                    className="ml-auto"
                  >
                    Alle anzeigen
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="ml-2 h-4 w-4"
                    >
                      <path d="M9 6l6 6-6 6"></path>
                    </svg>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}
          {/* Users Section */}
          {activeSection === "users" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">
                    Benutzerverwaltung
                  </h1>
                  <p className="text-muted-foreground mt-2">
                    Benutzer erstellen, bearbeiten oder entfernen
                  </p>
                </div>
                <Button onClick={handleCreateUser} className="w-full sm:w-auto">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Benutzer erstellen
                </Button>
              </div>

              <div className="relative max-w-md mb-6">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Benutzer suchen..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Card className="shadow-sm border-muted">
                <CardContent className="p-0">
                  {filteredUsers.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-muted/40">
                            <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                              Name
                            </th>
                            <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground hidden md:table-cell">
                              E-Mail
                            </th>
                            <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                              Rolle
                            </th>
                            <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground hidden lg:table-cell">
                              Erstellt am
                            </th>
                            <th className="text-right py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                              Aktionen
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.map((user) => (
                            <tr
                              key={user.id}
                              className="border-b border-muted/60 hover:bg-muted/30 transition-colors"
                            >
                              <td className="py-3 px-4 text-sm sm:text-base font-medium">
                                {user.name}
                              </td>
                              <td className="py-3 px-4 text-sm sm:text-base hidden md:table-cell">
                                {user.email}
                              </td>
                              <td className="py-3 px-4 text-sm sm:text-base">
                                <span
                                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                    user.role === "ADMIN"
                                      ? "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                      : user.role === "MANAGER"
                                      ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                      : "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                  }`}
                                >
                                  {user.role === "ADMIN"
                                    ? "Admin"
                                    : user.role === "MANAGER"
                                    ? "Manager"
                                    : "Benutzer"}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-sm sm:text-base hidden lg:table-cell text-muted-foreground">
                                {format(
                                  new Date(user.createdAt),
                                  "dd.MM.yyyy",
                                  { locale: de }
                                )}
                              </td>
                              <td className="py-3 px-4 text-right whitespace-nowrap">
                                <div className="flex justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      handleViewUserActivities(
                                        user.id,
                                        user.name
                                      )
                                    }
                                    className="h-8 w-8"
                                    title="Aktivitäten anzeigen"
                                  >
                                    <Clock className="h-4 w-4" />
                                    <span className="sr-only">Aktivitäten</span>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditUser(user)}
                                    className="h-8 w-8"
                                  >
                                    <Edit className="h-4 w-4" />
                                    <span className="sr-only">Bearbeiten</span>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeletePrompt(user)}
                                    className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                  >
                                    <Trash className="h-4 w-4" />
                                    <span className="sr-only">Löschen</span>
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <User className="h-10 w-10 text-muted-foreground mb-4" />
                      <p className="text-lg font-medium">
                        {searchTerm
                          ? "Keine Benutzer gefunden"
                          : "Keine Benutzer vorhanden"}
                      </p>
                      <p className="text-muted-foreground mt-1">
                        {searchTerm
                          ? `Es wurden keine Benutzer mit "${searchTerm}" gefunden`
                          : "Erstellen Sie einen neuen Benutzer, um zu beginnen"}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Activities Section */}
          {activeSection === "activities" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">
                    Zeiterfassung
                  </h1>
                  <p className="text-muted-foreground mt-2">
                    {filteredUserName
                      ? `Aktivitäten von ${filteredUserName} (letzte 7 Tage)`
                      : "Aktivitäten der letzten 7 Tage"}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 items-center">
                  {filteredUserId && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFilteredUserId(null);
                        setFilteredUserName(null);
                        fetchTimeEntries();
                      }}
                      size="sm"
                    >
                      <X className="mr-1 h-4 w-4" />
                      Filter aufheben
                    </Button>
                  )}
                  <Button
                    onClick={handleCreateTimeEntry}
                    className="w-full sm:w-auto"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Eintrag erstellen
                  </Button>
                  <div className="flex items-center text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
                    <Calendar className="h-4 w-4 mr-1" />
                    {format(subDays(new Date(), 7), "dd.MM.yyyy", {
                      locale: de,
                    })}{" "}
                    - {format(new Date(), "dd.MM.yyyy", { locale: de })}
                  </div>
                </div>
              </div>

              {/* New filter box */}
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
                            setFilteredUserId(null);
                            setFilteredUserName(null);
                          } else {
                            const selectedUser = users.find(
                              (u) => u.id === value
                            );
                            setFilteredUserId(value);
                            setFilteredUserName(selectedUser?.name || null);
                          }
                          fetchTimeEntries();
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
                        <div className="flex items-center text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-md w-full">
                          <Calendar className="h-4 w-4 mr-1" />
                          {format(subDays(new Date(), 7), "dd.MM.yyyy", {
                            locale: de,
                          })}{" "}
                          - {format(new Date(), "dd.MM.yyyy", { locale: de })}
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          className="flex-shrink-0"
                          onClick={fetchTimeEntries}
                          title="Aktualisieren"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="lucide lucide-refresh-cw"
                          >
                            <path d="M21 2v6h-6"></path>
                            <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                            <path d="M3 22v-6h6"></path>
                            <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
                          </svg>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-muted">
                <CardContent className="p-0">
                  {timeEntries.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-muted/40">
                            <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                              Benutzer
                            </th>
                            <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                              Datum
                            </th>
                            <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                              Start
                            </th>
                            <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                              Ende
                            </th>
                            <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                              Dauer
                            </th>
                            <th className="text-right py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground w-[100px]">
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
                                  <td className="py-3 px-4 text-sm sm:text-base font-medium">
                                    {entry.userName}
                                  </td>
                                  <td className="py-3 px-4 text-sm sm:text-base">
                                    {(() => {
                                      const start = new Date(entry.startTime);
                                      const end = new Date(entry.endTime);

                                      // Prüfe, ob es sich um einen mehrtägigen Eintrag handelt
                                      const isMultiDay = !isSameDay(start, end);

                                      if (isMultiDay) {
                                        return (
                                          <>
                                            {format(start, "dd.MM.yyyy", {
                                              locale: de,
                                            })}{" "}
                                            -{" "}
                                            {format(end, "dd.MM.yyyy", {
                                              locale: de,
                                            })}
                                            <span className="ml-2 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">
                                              Mehrtägig
                                            </span>
                                          </>
                                        );
                                      }

                                      return format(start, "dd.MM.yyyy", {
                                        locale: de,
                                      });
                                    })()}
                                  </td>
                                  <td className="py-3 px-4 text-sm sm:text-base">
                                    {format(
                                      new Date(entry.startTime),
                                      "HH:mm",
                                      { locale: de }
                                    )}
                                  </td>
                                  <td className="py-3 px-4 text-sm sm:text-base">
                                    {format(new Date(entry.endTime), "HH:mm", {
                                      locale: de,
                                    })}
                                  </td>
                                  <td className="py-3 px-4 text-sm sm:text-base font-mono">
                                    {formatTime(entry.duration)}
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <div className="flex justify-end gap-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() =>
                                          handleEditTimeEntry(entry)
                                        }
                                        className="h-8 w-8"
                                      >
                                        <Edit className="h-4 w-4" />
                                        <span className="sr-only">
                                          Bearbeiten
                                        </span>
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() =>
                                          handleDeleteTimeEntryPrompt(entry)
                                        }
                                        className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                      >
                                        <Trash className="h-4 w-4" />
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
                      <p className="text-lg font-medium">
                        Keine Aktivitäten verfügbar
                      </p>
                      <p className="text-muted-foreground mt-1">
                        Für die letzten 7 Tage wurden keine Zeiteinträge erfasst
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          {/* Logs Section */}
          {activeSection === "logs" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Logs</h1>
                <p className="text-muted-foreground mt-2">Aktionsprotokoll</p>
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
                            <td className="py-3 px-4 text-sm sm:text-base">
                              Benutzer
                            </td>
                            <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                              Aktion
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
                                {format(
                                  new Date(log.date),
                                  "dd.MM.yyyy HH:mm",
                                  { locale: de }
                                )}
                              </td>
                              <td className="py-3 px-4 text-sm sm:text-base">
                                {log.user && log.user.name
                                  ? log.user.name
                                  : log.userId || "Unbekannt"}
                                {log.user ? (
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
                                ) : null}
                              </td>
                              <td className="py-3 px-4 text-sm sm:text-base">
                                {log.action}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <Info className="h-10 w-10 text-muted-foreground mb-4" />
                      <p className="text-lg font-medium">
                        Keine Logs verfügbar
                      </p>
                      <p className="text-muted-foreground mt-1">
                        Es wurden keine Aktionen protokolliert
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          {activeSection === "breaks" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Pausenverwaltung
                </h1>
                <p className="text-muted-foreground mt-2">
                  Verwalten Sie automatische Pausen für Benutzer
                </p>
              </div>

              <div className="grid gap-6">
                {usersWithBreakSettings.map((user) => (
                  <Card key={user.id} className="overflow-hidden">
                    <CardHeader className="bg-muted/50 p-4">
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        {user.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <form
                        className="space-y-6"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          const breakDuration = Number(
                            formData.get("breakDuration")
                          );
                          const autoInsert =
                            formData.get("autoInsert") === "on";
                          handleSaveBreakSettings(
                            user.id,
                            breakDuration,
                            autoInsert
                          );
                        }}
                      >
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor={`breakDuration-${user.id}`}>
                              Pausendauer (Minuten)
                            </Label>
                            <Input
                              id={`breakDuration-${user.id}`}
                              name="breakDuration"
                              type="number"
                              min="0"
                              defaultValue={
                                user.breakSettings?.breakDuration || 30
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label
                              htmlFor={`autoInsert-${user.id}`}
                              className="block mb-2"
                            >
                              Automatisch einfügen
                            </Label>
                            <div className="flex items-center space-x-2 pt-2">
                              <Switch
                                id={`autoInsert-${user.id}`}
                                name="autoInsert"
                                defaultChecked={
                                  user.breakSettings?.autoInsert !== false
                                }
                              />
                              <Label htmlFor={`autoInsert-${user.id}`}>
                                Aktiviert
                              </Label>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <Button
                            type="submit"
                            className="flex items-center gap-2"
                          >
                            <Save className="h-4 w-4" />
                            Speichern
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="mt-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Automatische Pausen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Die automatischen Pausen werden genau in der Mitte der
                    Arbeitszeit eines Benutzers eingefügt. Die Pausenzeit wird
                    so berechnet, dass der Mittelpunkt der Pause genau in der
                    Mitte zwischen dem ersten und letzten Eintrag des Tages
                    liegt. Dies geschieht normalerweise automatisch am Ende des
                    Tages für alle Benutzer mit aktivierten automatischen
                    Pausen.
                  </p>

                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        setIsLoading(true);
                        const response = await fetch("/api/time/auto-breaks", {
                          method: "POST",
                        });

                        if (!response.ok) {
                          throw new Error("Failed to trigger automatic breaks");
                        }

                        const data = await response.json();
                        toast.success(
                          `${data.processedUsers} automatische Pausen eingefügt`
                        );
                      } catch {
                        toast.error(
                          "Fehler beim Einfügen der automatischen Pausen"
                        );
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    disabled={isLoading}
                  >
                    Automatische Pausen jetzt einfügen
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
          {/* Export Section */}
          {activeSection === "export" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Export</h1>
                <p className="text-muted-foreground mt-2">
                  Arbeitszeiten exportieren
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Arbeitszeiten exportieren</CardTitle>
                  <CardDescription>
                    Exportieren Sie die Arbeitszeiten als Excel-Datei (.xlsx)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Zeitraum</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Button
                          variant={
                            exportPeriod === "day" ? "default" : "outline"
                          }
                          onClick={() => setExportPeriod("day")}
                          className="w-full"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          Letzter Tag
                        </Button>
                        <Button
                          variant={
                            exportPeriod === "month" ? "default" : "outline"
                          }
                          onClick={() => setExportPeriod("month")}
                          className="w-full"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          Letzten 30 Tage
                        </Button>
                        <Button
                          variant={
                            exportPeriod === "year" ? "default" : "outline"
                          }
                          onClick={() => setExportPeriod("year")}
                          className="w-full"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          Letztes Jahr
                        </Button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium mb-2">
                        Benutzer (optional)
                      </h3>
                      <Select
                        value={exportUserId}
                        onValueChange={setExportUserId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Alle Benutzer" />
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
                      <p className="text-xs text-muted-foreground mt-1">
                        Wählen Sie einen bestimmten Benutzer aus oder
                        exportieren Sie alle Benutzer
                      </p>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button
                      onClick={handleExport}
                      disabled={exportLoading}
                      className="w-full sm:w-auto"
                    >
                      {exportLoading ? (
                        <>
                          <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full" />
                          Exportiere...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Als Excel exportieren
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          {/* Vacations Section */}
          {activeSection === "vacations" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Urlaubsanträge</h1>
                <p className="text-muted-foreground mt-2">Verwalten Sie Urlaubsanträge der Mitarbeiter</p>
              </div>
              
              <Card className="shadow-sm border-muted">
                <CardContent className="p-0">
                  {vacations.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-muted/40">
                            <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                              Mitarbeiter
                            </th>
                            <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                              Zeitraum
                            </th>
                            <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                              Tage
                            </th>
                            <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                              Status
                            </th>
                            <th className="text-right py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                              Aktionen
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {vacations.map((vacation) => (
                            <tr
                              key={vacation.id}
                              className="border-b border-muted/60 hover:bg-muted/30 transition-colors"
                            >
                              <td className="py-3 px-4 text-sm sm:text-base font-medium">
                                {vacation.user?.name || "Unbekannt"}
                              </td>
                              <td className="py-3 px-4 text-sm sm:text-base">
                                {format(new Date(vacation.startDate), "dd.MM.yyyy", { locale: de })} -<br />
                                {format(new Date(vacation.endDate), "dd.MM.yyyy", { locale: de })}
                              </td>
                              <td className="py-3 px-4 text-sm sm:text-base">
                                {vacation.days}
                              </td>
                              <td className="py-3 px-4 text-sm sm:text-base">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                  vacation.status === "approved"
                                    ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                    : vacation.status === "rejected"
                                    ? "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                    : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                }`}>
                                  {vacation.status === "approved"
                                    ? "Genehmigt"
                                    : vacation.status === "rejected"
                                    ? "Abgelehnt"
                                    : "Ausstehend"}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleViewVacationDetails(vacation)}
                                    className="h-8 w-8"
                                  >
                                    <Eye className="h-4 w-4" />
                                    <span className="sr-only">Details</span>
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <Calendar className="h-10 w-10 text-muted-foreground mb-4" />
                      <p className="text-lg font-medium">Keine Urlaubsanträge vorhanden</p>
                      <p className="text-muted-foreground mt-1">
                        Es wurden noch keine Urlaubsanträge gestellt
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          {/* Vacations Section */}
          {activeSection === "settings" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Einstellungen</h1>
                <p className="text-muted-foreground mt-2">Verwalten Sie die Anwendungseinstellungen</p>
              </div>

              <Card>
                <CardContent className="space-y-6">
                  {settings.map((setting) => (
                    <div key={setting.key} className="grid gap-2">
                      <Label htmlFor={setting.key}>{setting.key}</Label>
                      {setting.type === "boolean" ? (
                        <Switch
                          id={setting.key}
                          checked={setting.value === "true"}
                          onCheckedChange={(checked) =>
                            setSettings((prev) =>
                              prev.map((s) =>
                                s.key === setting.key
                                  ? { ...s, value: checked ? "true" : "false" }
                                  : s
                              )
                            )
                          }
                        />
                      ) : (
                        <Input
                          id={setting.key}
                          value={setting.value || setting.defaultValue}
                          onChange={(e) =>
                            setSettings((prev) =>
                              prev.map((s) =>
                                s.key === setting.key
                                  ? { ...s, value: e.target.value }
                                  : s
                              )
                            )
                          }
                        />
                      )}
                      <p className="text-sm text-muted-foreground">
                        {setting.description}
                      </p>
                    </div>
                  ))}
                </CardContent>
                <CardFooter className="border-t bg-muted/30 flex justify-between">
                  <div className="text-sm text-muted-foreground flex items-center">
                    <Info className="h-4 w-4 mr-2" />
                    Änderungen werden erst nach einem Neustart der Anwendung wirksam
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={fetchSettings}
                      disabled={isLoading || isSaving}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Zurücksetzen
                    </Button>
                    <Button 
                      onClick={handleSaveSettings}
                      disabled={isLoading || isSaving}
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full" />
                          Speichern...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Einstellungen speichern
                        </>
                      )}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* User Create/Edit Dialog */}
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {isEditing ? "Benutzer bearbeiten" : "Neuen Benutzer erstellen"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newUser.name}
                onChange={(e) =>
                  setNewUser({ ...newUser, name: e.target.value })
                }
                placeholder="Max Mustermann"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
                placeholder="max@beispiel.de"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">
                Passwort{" "}
                {isEditing && (
                  <span className="text-xs text-muted-foreground">
                    (leer lassen, um nicht zu ändern)
                  </span>
                )}
              </Label>
              <Input
                id="password"
                type="password"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
                placeholder={isEditing ? "••••••••" : "Passwort"}
                required={!isEditing}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Rolle</Label>
              <Select
                value={newUser.role}
                onValueChange={(value) =>
                  setNewUser({ ...newUser, role: value })
                }
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Rolle auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">Benutzer</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="ADMIN">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setUserDialogOpen(false)}
              disabled={isLoading}
              className="hidden sm:flex"
            >
              <X className="mr-2 h-4 w-4" />
              Abbrechen
            </Button>
            <Button
              onClick={handleSaveUser}
              disabled={
                isLoading ||
                !newUser.name ||
                !newUser.email ||
                (!isEditing && !newUser.password)
              }
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
                  {isEditing ? "Aktualisieren" : "Erstellen"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-xl text-destructive">
              Benutzer löschen
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <div className="flex items-center gap-3 p-3 bg-destructive/10 rounded-md text-destructive">
              <Info className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">
                Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
            </div>
            <p className="pt-2">
              Sind Sie sicher, dass Sie den Benutzer{" "}
              <span className="font-semibold">{userToDelete?.name}</span>{" "}
              löschen möchten?
            </p>
          </div>
          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isLoading}
              className="hidden sm:flex"
            >
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full" />
                  <span>Löschen...</span>
                </div>
              ) : (
                <>
                  <Trash className="mr-2 h-4 w-4" />
                  Benutzer löschen
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Time Entry Edit Dialog */}
      <Dialog open={timeEntryDialogOpen} onOpenChange={setTimeEntryDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Zeiteintrag bearbeiten
            </DialogTitle>
            {editingTimeEntry && (
              <p className="text-sm text-muted-foreground mt-1">
                {editingTimeEntry.userName} -{" "}
                {format(new Date(editingTimeEntry.startTime), "dd.MM.yyyy", {
                  locale: de,
                })}
              </p>
            )}
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Startdatum</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={timeEntryForm.startDate}
                  onChange={(e) =>
                    setTimeEntryForm({
                      ...timeEntryForm,
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
                  value={timeEntryForm.startTime}
                  onChange={(e) =>
                    setTimeEntryForm({
                      ...timeEntryForm,
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
                  value={timeEntryForm.endDate}
                  onChange={(e) =>
                    setTimeEntryForm({
                      ...timeEntryForm,
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
                  value={timeEntryForm.endTime}
                  onChange={(e) =>
                    setTimeEntryForm({
                      ...timeEntryForm,
                      endTime: e.target.value,
                    })
                  }
                  className="w-full"
                />
              </div>
            </div>

            {editingTimeEntry && (
              <div className="bg-muted rounded-md p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Ursprüngliche Dauer:
                  </span>
                  <span className="font-mono">
                    {formatTime(editingTimeEntry.duration)}
                  </span>
                </div>

                {/* Calculate and show new duration */}
                {timeEntryForm.startDate &&
                  timeEntryForm.startTime &&
                  timeEntryForm.endDate &&
                  timeEntryForm.endTime &&
                  (() => {
                    try {
                      const start = new Date(
                        `${timeEntryForm.startDate}T${timeEntryForm.startTime}:00`
                      );
                      const end = new Date(
                        `${timeEntryForm.endDate}T${timeEntryForm.endTime}:00`
                      );
                      const newDuration = Math.floor(
                        (end.getTime() - start.getTime()) / 1000
                      );

                      return (
                        <div className="flex items-center justify-between mt-2 text-sm">
                          <span className="font-medium">Neue Dauer:</span>
                          <span
                            className={`font-mono ${
                              newDuration < 0
                                ? "text-destructive"
                                : "text-green-600 dark:text-green-400"
                            }`}
                          >
                            {newDuration < 0
                              ? "Ungültig"
                              : formatTime(newDuration)}
                          </span>
                        </div>
                      );
                    } catch {
                      return null;
                    }
                  })()}
              </div>
            )}
          </div>
          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setTimeEntryDialogOpen(false)}
              disabled={isLoading}
              className="hidden sm:flex"
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleSaveTimeEntry}
              disabled={
                isLoading ||
                !timeEntryForm.startDate ||
                !timeEntryForm.endDate ||
                !timeEntryForm.startTime ||
                !timeEntryForm.endTime
              }
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
                  Aktualisieren
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Zeiteintrag erstellen Dialog */}
      <Dialog
        open={createTimeEntryDialogOpen}
        onOpenChange={setCreateTimeEntryDialogOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Neuen Zeiteintrag erstellen
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="userId">Benutzer</Label>
              <Select
                value={newTimeEntryForm.userId}
                onValueChange={(value) =>
                  setNewTimeEntryForm({ ...newTimeEntryForm, userId: value })
                }
              >
                <SelectTrigger id="userId">
                  <SelectValue placeholder="Benutzer auswählen" />
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Startdatum</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={newTimeEntryForm.startDate}
                  onChange={(e) =>
                    setNewTimeEntryForm({
                      ...newTimeEntryForm,
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
                  value={newTimeEntryForm.startTime}
                  onChange={(e) =>
                    setNewTimeEntryForm({
                      ...newTimeEntryForm,
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
                  value={newTimeEntryForm.endDate}
                  onChange={(e) =>
                    setNewTimeEntryForm({
                      ...newTimeEntryForm,
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
                  value={newTimeEntryForm.endTime}
                  onChange={(e) =>
                    setNewTimeEntryForm({
                      ...newTimeEntryForm,
                      endTime: e.target.value,
                    })
                  }
                  className="w-full"
                />
              </div>
            </div>

            {/* Calculate and show duration */}
            {newTimeEntryForm.startDate &&
              newTimeEntryForm.startTime &&
              newTimeEntryForm.endDate &&
              newTimeEntryForm.endTime &&
              (() => {
                try {
                  const start = new Date(
                    `${newTimeEntryForm.startDate}T${newTimeEntryForm.startTime}:00`
                  );
                  const end = new Date(
                    `${newTimeEntryForm.endDate}T${newTimeEntryForm.endTime}:00`
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
              onClick={() => setCreateTimeEntryDialogOpen(false)}
              disabled={isLoading}
              className="hidden sm:flex"
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleSaveNewTimeEntry}
              disabled={
                isLoading ||
                !newTimeEntryForm.userId ||
                !newTimeEntryForm.startDate ||
                !newTimeEntryForm.startTime ||
                !newTimeEntryForm.endDate ||
                !newTimeEntryForm.endTime
              }
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

      {/* Zeiteintrag löschen Dialog */}
      <Dialog
        open={deleteTimeEntryDialogOpen}
        onOpenChange={setDeleteTimeEntryDialogOpen}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-xl text-destructive">
              Zeiteintrag löschen
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <div className="flex items-center gap-3 p-3 bg-destructive/10 rounded-md text-destructive">
              <Info className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">
                Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
            </div>
            {timeEntryToDelete && (
              <div className="pt-2 space-y-4">
                <p>
                  Sind Sie sicher, dass Sie diesen Zeiteintrag löschen möchten?
                </p>
                <div className="bg-muted rounded-md p-3 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="font-medium">Benutzer:</span>
                    <span>{timeEntryToDelete.userName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Datum:</span>
                    <span>
                      {format(
                        new Date(timeEntryToDelete.startTime),
                        "dd.MM.yyyy",
                        { locale: de }
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Zeit:</span>
                    <span>
                      {format(new Date(timeEntryToDelete.startTime), "HH:mm", {
                        locale: de,
                      })}{" "}
                      -{" "}
                      {format(new Date(timeEntryToDelete.endTime), "HH:mm", {
                        locale: de,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Dauer:</span>
                    <span className="font-mono">
                      {formatTime(timeEntryToDelete.duration)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setDeleteTimeEntryDialogOpen(false)}
              disabled={isLoading}
              className="hidden sm:flex"
            >
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTimeEntry}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full" />
                  <span>Löschen...</span>
                </div>
              ) : (
                <>
                  <Trash className="mr-2 h-4 w-4" />
                  Zeiteintrag löschen
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      {/* Vacation Details Dialog */}
      <Dialog open={vacationDetailsOpen} onOpenChange={setVacationDetailsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Urlaubsantrag</DialogTitle>
            {selectedVacation && (
              <DialogDescription>
                Von {selectedVacation.user?.name || "Unbekannt"}
              </DialogDescription>
            )}
          </DialogHeader>
          {selectedVacation && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="font-medium">Zeitraum:</div>
                <div className="col-span-2">
                  {format(new Date(selectedVacation.startDate), "dd.MM.yyyy", { locale: de })} - {format(new Date(selectedVacation.endDate), "dd.MM.yyyy", { locale: de })}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="font-medium">Urlaubstage:</div>
                <div className="col-span-2">{selectedVacation.days} Tage</div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="font-medium">Status:</div>
                <div className="col-span-2">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    selectedVacation.status === "approved"
                      ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : selectedVacation.status === "rejected"
                      ? "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  }`}>
                    {selectedVacation.status === "approved"
                      ? "Genehmigt"
                      : selectedVacation.status === "rejected"
                      ? "Abgelehnt"
                      : "Ausstehend"}
                  </span>
                </div>
              </div>

              {selectedVacation.description && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="font-medium">Bemerkung:</div>
                  <div className="col-span-2">{selectedVacation.description}</div>
                </div>
              )}
              
              <div className="grid grid-cols-3 gap-2">
                <div className="font-medium">Beantragt am:</div>
                <div className="col-span-2">
                  {format(new Date(selectedVacation.createdAt), "dd.MM.yyyy", { locale: de })}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="font-medium">Kontingent:</div>
                <div className="col-span-2">
                  {selectedVacation.user?.vacationDaysTaken || 0} von {selectedVacation.user?.vacationDaysPerYear || 30} Tagen genommen
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {selectedVacation && selectedVacation.status === "pending" && (
              <>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
                  onClick={() => handleVacationStatusChange(selectedVacation.id, "rejected")}
                  disabled={isLoading}
                >
                  <CalendarX className="mr-2 h-4 w-4" />
                  Ablehnen
                </Button>
                <Button
                  className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                  onClick={() => handleVacationStatusChange(selectedVacation.id, "approved")}
                  disabled={isLoading}
                >
                  <CalendarCheck className="mr-2 h-4 w-4" />
                  Genehmigen
                </Button>
              </>
            )}
            {selectedVacation && selectedVacation.status !== "pending" && (
              <Button
                onClick={() => setVacationDetailsOpen(false)}
                className="w-full sm:w-auto"
              >
                Schließen
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
