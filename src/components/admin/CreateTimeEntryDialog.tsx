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
import { useAdminActivities } from "@/hooks/useAdminActivities";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User } from "@prisma/client"; // Import Prisma's User type instead of custom UserData

interface CreateTimeEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

interface TimeEntryFormData {
  userId: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
}

export function CreateTimeEntryDialog({ open, onOpenChange, onCreated }: CreateTimeEntryDialogProps) {
  const { createTimeEntry } = useAdminActivities();
  const { users, fetchUsers } = useAdminUsers();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<TimeEntryFormData>({
    userId: "",
    startDate: format(new Date(), "yyyy-MM-dd"),
    startTime: format(new Date(), "HH:mm"),
    endDate: format(new Date(), "yyyy-MM-dd"),
    endTime: format(new Date(Date.now() + 60 * 60 * 1000), "HH:mm"),
  });

  // Fetch users when dialog opens
  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open, fetchUsers]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setFormData({
        userId: "",
        startDate: format(new Date(), "yyyy-MM-dd"),
        startTime: format(new Date(), "HH:mm"),
        endDate: format(new Date(), "yyyy-MM-dd"),
        endTime: format(new Date(Date.now() + 60 * 60 * 1000), "HH:mm"),
      });
    }
  }, [open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUserChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      userId: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.userId) {
      return; // Prevent submission if no user is selected
    }
    
    setIsSubmitting(true);
    
    try {
      // Convert form data to API format
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
      
      // Ensure dates are valid
      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        throw new Error("Ungültiges Datum oder Uhrzeit");
      }
      
      // Ensure end time is after start time
      if (endDateTime <= startDateTime) {
        throw new Error("Endzeit muss nach Startzeit liegen");
      }
      
      await createTimeEntry({
        userId: formData.userId,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
      });
      
      onOpenChange(false);
      if (onCreated) onCreated();
    } catch (error) {
      console.error("Failed to create time entry:", error);
      // You might want to add toast.error here
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Neuen Zeiteintrag erstellen</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="userId">Benutzer</Label>
              <Select
                value={formData.userId}
                onValueChange={handleUserChange}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Benutzer auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user: User) => (
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
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="startTime">Startzeit</Label>
                <Input
                  id="startTime"
                  name="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="endDate">Enddatum</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endTime">Endzeit</Label>
                <Input
                  id="endTime"
                  name="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Wird erstellt..." : "Erstellen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}