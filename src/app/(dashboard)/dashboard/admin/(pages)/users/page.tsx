"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, UserPlus, Pencil, Trash2, Clock } from "lucide-react";
import { UserDialog } from "@/components/admin/UserDialog";
import { DeleteUserDialog } from "@/components/admin/DeleteUserDialog";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { useRouter } from "next/navigation";
import { User } from "@prisma/client";
import { useSession } from "next-auth/react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ROLE_HIERARCHY: Record<string, number> = {
  ADMIN: 3,
  MANAGER: 2,
  USER: 1,
};

export default function UsersPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { users, isLoading, fetchUsers } = useAdminUsers();
  const [searchTerm, setSearchTerm] = useState("");
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Filter users based on search term
  const filteredUsers = users.filter(
    (user) =>
      (user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  // User creation handler
  const handleCreateUser = () => {
    setSelectedUser(null);
    setUserDialogOpen(true);
  };

  // User edit handler
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setUserDialogOpen(true);
  };

  const canDeleteUser = (user: User): boolean => {
    if (!session?.user?.id || !session?.user?.role) return false;
    if (user.id === session.user.id) return false;
    if (users.length <= 1) return false;
    
    const currentUserLevel = ROLE_HIERARCHY[session.user.role] || 0;
    const targetUserLevel = ROLE_HIERARCHY[user.role] || 0;
    
    return targetUserLevel < currentUserLevel;
  };

  const getDeleteTooltip = (user: User): string => {
    if (!session?.user?.id || !session?.user?.role) {
      return "Keine Berechtigung";
    }
    if (user.id === session.user.id) {
      return "Sie können Ihren eigenen Account nicht löschen";
    }
    if (users.length <= 1) {
      return "Der letzte Account kann nicht gelöscht werden";
    }
    
    const currentUserLevel = ROLE_HIERARCHY[session.user.role] || 0;
    const targetUserLevel = ROLE_HIERARCHY[user.role] || 0;
    
    if (targetUserLevel >= currentUserLevel) {
      return "Sie können keine Benutzer mit gleicher oder höherer Rolle löschen";
    }
    
    return "Benutzer löschen";
  };

  const handleDeletePrompt = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleViewUserActivities = (
    userId: string,
    userName: string | null
  ) => {
    router.push(
      `/dashboard/admin/activities?userId=${userId}&userName=${encodeURIComponent(
        userName || "Unbekannt"
      )}`
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full py-10">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full" />
          <p className="text-muted-foreground">Lade Benutzerdaten...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-0 max-w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Benutzerverwaltung
          </h1>
          <p className="text-muted-foreground mt-2">
            Benutzer erstellen, bearbeiten oder entfernen
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center w-full sm:w-auto">
          {/* Search input */}
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Benutzer suchen..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={handleCreateUser} className="w-full sm:w-auto">
            <UserPlus className="mr-2 h-4 w-4" />
            Benutzer erstellen
          </Button>
        </div>
      </div>

      {/* Users table */}
      <Card className="shadow-sm border-muted">
        <CardContent className="p-0 overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 sm:px-4 text-sm font-medium text-muted-foreground">
                    Name
                  </th>
                  <th className="text-left py-3 px-2 sm:px-4 text-sm font-medium text-muted-foreground">
                    E-Mail
                  </th>
                  <th className="text-left py-3 px-2 sm:px-4 text-sm font-medium text-muted-foreground">
                    Rolle
                  </th>
                  <th className="text-right py-3 px-2 sm:px-4 text-sm font-medium text-muted-foreground">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-muted/60 hover:bg-muted/30"
                    >
                      <td className="py-3 px-2 sm:px-4 font-medium text-xs sm:text-sm">
                        {user.name}
                      </td>
                      <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm truncate max-w-[150px] sm:max-w-none">
                        {user.email}
                      </td>
                      <td className="py-3 px-2 sm:px-4">
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
                      <td className="py-3 px-2 sm:px-4 text-right">
                        <div className="flex items-center justify-end gap-1 sm:gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              handleViewUserActivities(user.id, user.name)
                            }
                          >
                            <Clock className="h-4 w-4" />
                            <span className="sr-only">Aktivitäten</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditUser(user)}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Bearbeiten</span>
                          </Button>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleDeletePrompt(user)}
                                disabled={!canDeleteUser(user)}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Löschen</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{getDeleteTooltip(user)}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-6 text-center text-muted-foreground"
                    >
                      {searchTerm
                        ? "Keine Benutzer gefunden."
                        : "Keine Benutzer vorhanden."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <UserDialog
        open={userDialogOpen}
        onOpenChange={setUserDialogOpen}
        user={selectedUser}
        onSaved={fetchUsers}
      />

      <DeleteUserDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        user={selectedUser}
        onSaved={fetchUsers}
      />
    </div>
  );
}
