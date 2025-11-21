import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { User } from "@prisma/client";

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSaved?: () => void;
}

// Define a type for valid user roles to match Prisma schema
type UserRole = "USER" | "ADMIN" | "MANAGER";

interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  showWeeklySummary: boolean;
  weeklyTargetHours: number;
}

export function UserDialog({ open, onOpenChange, user, onSaved }: UserDialogProps) {
  const { createUser, updateUser } = useAdminUsers();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<UserFormData>({
    name: "",
    email: "",
    password: "",
    role: "USER",
    showWeeklySummary: true,
    weeklyTargetHours: 40.0
  });

  // Reset form when dialog opens/closes or user changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name ?? "",
        email: user.email ?? "",
        password: "", // Don't prefill password
        role: user.role as UserRole,
        showWeeklySummary: user.showWeeklySummary ?? true,
        weeklyTargetHours: user.weeklyTargetHours ?? 40.0
      });
    } else {
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "USER",
        showWeeklySummary: true,
        weeklyTargetHours: 40.0
      });
    }
  }, [user, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRoleChange = (value: UserRole) => {
    setFormData(prev => ({
      ...prev,
      role: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (user) {
        // Update existing user
        const payload: {
          name: string;
          email: string;
          password?: string;
          role: UserRole;
          showWeeklySummary: boolean;
          weeklyTargetHours: number;
        } = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          showWeeklySummary: formData.showWeeklySummary,
          weeklyTargetHours: formData.weeklyTargetHours
        };
        
        // Only include password if it's not empty
        if (formData.password) {
          payload.password = formData.password;
        }
        
        await updateUser(user.id, payload);
      } else {
        // Create new user
        await createUser({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          showWeeklySummary: formData.showWeeklySummary,
          weeklyTargetHours: formData.weeklyTargetHours
        });
      }
      onOpenChange(false);
      if (onSaved) onSaved();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {user ? "Benutzer bearbeiten" : "Neuen Benutzer erstellen"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">
                {user ? "Passwort (leer lassen für unverändert)" : "Passwort"}
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required={!user}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Rolle</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => handleRoleChange(value as UserRole)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Rolle auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">Benutzer</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="ADMIN">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="weeklyTargetHours">Soll-Stunden pro Woche</Label>
              <Input
                id="weeklyTargetHours"
                name="weeklyTargetHours"
                type="number"
                min="0"
                max="168"
                step="0.5"
                value={formData.weeklyTargetHours}
                onChange={(e) => setFormData(prev => ({ ...prev, weeklyTargetHours: parseFloat(e.target.value) || 0 }))}
                required
              />
              <p className="text-xs text-muted-foreground">Standard: 40 Stunden pro Woche</p>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="showWeeklySummary">Wochensumme anzeigen</Label>
                <p className="text-xs text-muted-foreground">
                  Zeigt KW-Summe im Admin-Dashboard an
                </p>
              </div>
              <Switch
                id="showWeeklySummary"
                checked={formData.showWeeklySummary}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, showWeeklySummary: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Wird gespeichert..." : "Speichern"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}