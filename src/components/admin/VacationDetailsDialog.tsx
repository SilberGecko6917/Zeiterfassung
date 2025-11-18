import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useState } from "react";
import { useAdminVacations } from "@/hooks/useAdminVacations";
import { VacationData } from "@/types/dashboard";

interface VacationDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vacation: (VacationData & { user?: { name: string; email: string } }) | null;
}

export function VacationDetailsDialog({ open, onOpenChange, vacation }: VacationDetailsDialogProps) {
  const { updateVacationStatus } = useAdminVacations();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!vacation) return null;

  const handleStatusChange = async (newStatus: "APPROVED" | "REJECTED") => {
    setIsProcessing(true);
    try {
      await updateVacationStatus(vacation.id, newStatus);
      onOpenChange(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500">Ausstehend</Badge>;
      case "APPROVED":
        return <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500">Genehmigt</Badge>;
      case "REJECTED":
        return <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500">Abgelehnt</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Urlaubsantrag Details</DialogTitle>
          <DialogDescription>
            Urlaubsantrag von {vacation.user?.name || "Unbekannter Benutzer"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <div className="mt-1">{getStatusBadge(vacation.status)}</div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Anzahl Tage</p>
              <p className="mt-1">{vacation.days} Tage</p>
            </div>
          </div>
          
          <div>
            <p className="text-sm font-medium text-muted-foreground">Zeitraum</p>
            <p className="mt-1">
              {format(new Date(vacation.startDate), "dd.MM.yyyy", { locale: de })} - {format(new Date(vacation.endDate), "dd.MM.yyyy", { locale: de })}
            </p>
          </div>
          
          {vacation.note && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Notiz</p>
              <p className="mt-1 whitespace-pre-wrap">{vacation.note}</p>
            </div>
          )}
          
          <div>
            <p className="text-sm font-medium text-muted-foreground">Beantragt am</p>
            <p className="mt-1">
              {format(new Date(vacation.createdAt), "dd.MM.yyyy HH:mm", { locale: de })}
            </p>
          </div>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          {vacation.status === "PENDING" && (
            <>
              <Button 
                onClick={() => handleStatusChange("REJECTED")}
                variant="destructive"
                disabled={isProcessing}
                className="w-full sm:w-auto"
              >
                Ablehnen
              </Button>
              <Button 
                onClick={() => handleStatusChange("APPROVED")}
                disabled={isProcessing}
                className="w-full sm:w-auto"
              >
                Genehmigen
              </Button>
            </>
          )}
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Schließen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}