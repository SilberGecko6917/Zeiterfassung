"use client";

import { WeeklySummary } from "@/components/admin/WeeklySummary";

export default function WeeklySummaryPage() {
  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Kalenderwochen-Übersicht
        </h1>
        <p className="text-muted-foreground mt-2">
          Gegenüberstellung von Ist- und Soll-Stunden pro Kalenderwoche
        </p>
      </div>

      <WeeklySummary />
    </div>
  );
}
