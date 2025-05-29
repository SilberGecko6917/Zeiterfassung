import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { User } from '@prisma/client';

// Define types for operations
type CreateUserData = {
  name: string;
  email: string;
  password: string;
  role: "USER" | "ADMIN" | "MANAGER";
};

type UpdateUserData = {
  name?: string;
  email?: string;
  password?: string;
  role?: "USER" | "ADMIN" | "MANAGER";
};

export function useAdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
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

  const createUser = async (userData: CreateUserData): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Fehler beim Erstellen des Benutzers");
      }
      
      await fetchUsers();
      toast.success("Benutzer erfolgreich erstellt");
      return true;
    } catch (error) {
      console.error("Failed to create user:", error);
      toast.error(error instanceof Error ? error.message : "Fehler beim Erstellen des Benutzers");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (userId: string, userData: UpdateUserData): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Fehler beim Aktualisieren des Benutzers");
      }
      
      await fetchUsers();
      toast.success("Benutzer erfolgreich aktualisiert");
      return true;
    } catch (error) {
      console.error("Failed to update user:", error);
      toast.error(error instanceof Error ? error.message : "Fehler beim Aktualisieren des Benutzers");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Fehler beim Löschen des Benutzers");
      }
      
      await fetchUsers();
      toast.success("Benutzer erfolgreich gelöscht");
      return true;
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast.error(error instanceof Error ? error.message : "Fehler beim Löschen des Benutzers");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    users,
    isLoading,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser
  };
}