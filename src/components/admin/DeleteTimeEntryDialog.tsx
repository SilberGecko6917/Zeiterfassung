import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useAdminActivities, TimeEntryWithUser } from "@/hooks/useAdminActivities";
import { useAdminUsers } from "@/hooks/useAdminUsers";

interface DeleteTimeEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: TimeEntryWithUser | null;
  onDeleted?: () => void;
}

export function DeleteTimeEntryDialog({
  open,
  onOpenChange,
  entry,
  onDeleted,
}: DeleteTimeEntryDialogProps) {
  const { deleteTimeEntry } = useAdminActivities();
  const { users } = useAdminUsers();
  const [isDeleting, setIsDeleting] = useState(false);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : `Benutzer ${userId}`;
  };

  const handleDelete = async () => {
    if (!entry) return;
    
    setIsDeleting(true);
    try {
      await deleteTimeEntry(entry.id.toString());
      onOpenChange(false);
      if (onDeleted) onDeleted();
    } finally {
      setIsDeleting(false);
    }
  };

  if (!entry) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Zeiteintrag löschen</AlertDialogTitle>
          <AlertDialogDescription>
            Sind Sie sicher, dass Sie diesen Zeiteintrag löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="bg-muted rounded-md p-3 text-sm space-y-1 my-2">
          <div className="flex justify-between">
            <span className="font-medium">Benutzer:</span>
            <span>{entry.user ? entry.user.name : getUserName(entry.userId)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Datum:</span>
            <span>
              {format(
                new Date(entry.startTime),
                "dd.MM.yyyy",
                { locale: de }
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Zeit:</span>
            <span>
              {format(new Date(entry.startTime), "HH:mm", {
                locale: de,
              })}{" "}
              -{" "}
              {entry.endTime ? format(new Date(entry.endTime), "HH:mm", {
                locale: de,
              }) : "--:--"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Dauer:</span>
            <span className="font-mono">
              {formatTime(Number(entry.duration))}
            </span>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Abbrechen</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete} 
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Wird gelöscht..." : "Löschen"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}