"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus, Calendar } from "lucide-react";
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek, getISOWeek, getYear } from "date-fns";
import { de } from "date-fns/locale";
import { toast } from "sonner";

interface UserWeeklySummary {
  userId: string;
  userName: string;
  email: string;
  weekNumber: number;
  year: number;
  actualHours: number;
  targetHours: number;
  difference: number;
  percentage: number;
  showWeeklySummary: boolean;
}

interface WeeklySummaryProps {
  userId?: string; // Optional: filter by specific user
}

export function WeeklySummary({ userId }: WeeklySummaryProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [summaries, setSummaries] = useState<UserWeeklySummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const today = new Date();
  const [weekInfo, setWeekInfo] = useState({
    number: getISOWeek(today),
    year: getYear(today),
    start: format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd"),
    end: format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd"),
    label: `KW ${getISOWeek(today)} ${getYear(today)}`,
  });

  const fetchWeeklySummary = async () => {
    try {
      setIsLoading(true);
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const dateParam = format(weekStart, "yyyy-MM-dd");
      
      const url = userId
        ? `/api/admin/weekly-summary?userId=${userId}&week=${dateParam}`
        : `/api/admin/weekly-summary?week=${dateParam}`;

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error("Failed to fetch weekly summary");
      }

      const data = await response.json();
      
      // Filter users based on showWeeklySummary setting
      const filteredSummaries = data.summaries.filter(
        (s: UserWeeklySummary) => s.showWeeklySummary
      );
      
      setSummaries(filteredSummaries);
      setWeekInfo(data.week);
    } catch (error) {
      console.error("Error fetching weekly summary:", error);
      toast.error("Fehler beim Laden der Wochensummen");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWeeklySummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, userId]);

  const handlePreviousWeek = () => {
    setCurrentDate((prev) => subWeeks(prev, 1));
  };

  const handleNextWeek = () => {
    setCurrentDate((prev) => addWeeks(prev, 1));
  };

  const handleCurrentWeek = () => {
    setCurrentDate(new Date());
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 95 && percentage <= 105) {
      return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20";
    } else if (percentage >= 80 && percentage < 95) {
      return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20";
    } else if (percentage > 105) {
      return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20";
    } else {
      return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20";
    }
  };

  const getStatusIcon = (difference: number) => {
    if (Math.abs(difference) < 2) {
      return <Minus className="h-4 w-4" />;
    } else if (difference > 0) {
      return <TrendingUp className="h-4 w-4" />;
    } else {
      return <TrendingDown className="h-4 w-4" />;
    }
  };

  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}:${m.toString().padStart(2, "0")}h`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Wochensummen - {weekInfo.label}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousWeek}
              disabled={isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCurrentWeek}
              disabled={isLoading}
            >
              Aktuelle Woche
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextWeek}
              disabled={isLoading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {weekInfo.start && weekInfo.end && (
          <p className="text-sm text-muted-foreground mt-2">
            {format(new Date(weekInfo.start), "dd.MM.yyyy", { locale: de })} -{" "}
            {format(new Date(weekInfo.end), "dd.MM.yyyy", { locale: de })}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {summaries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Mitarbeiter
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                    Ist-Stunden
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                    Soll-Stunden
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                    Differenz
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                    Erfüllung
                  </th>
                </tr>
              </thead>
              <tbody>
                {summaries.map((summary) => (
                  <tr
                    key={summary.userId}
                    className="border-b border-muted/60 hover:bg-muted/30"
                  >
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-medium">{summary.userName}</span>
                        <span className="text-xs text-muted-foreground">
                          {summary.email}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-semibold">
                      {formatHours(summary.actualHours)}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-muted-foreground">
                      {formatHours(summary.targetHours)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {getStatusIcon(summary.difference)}
                        <span
                          className={`font-mono font-semibold ${
                            summary.difference >= 0
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {summary.difference >= 0 ? "+" : ""}
                          {formatHours(Math.abs(summary.difference))}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(
                          summary.percentage
                        )}`}
                      >
                        {summary.percentage.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 font-semibold bg-muted/50">
                  <td className="py-3 px-4">Gesamt</td>
                  <td className="py-3 px-4 text-center font-mono">
                    {formatHours(
                      summaries.reduce((sum, s) => sum + s.actualHours, 0)
                    )}
                  </td>
                  <td className="py-3 px-4 text-center font-mono">
                    {formatHours(
                      summaries.reduce((sum, s) => sum + s.targetHours, 0)
                    )}
                  </td>
                  <td className="py-3 px-4 text-center font-mono">
                    {(() => {
                      const totalDiff = summaries.reduce(
                        (sum, s) => sum + s.difference,
                        0
                      );
                      return (
                        <span
                          className={
                            totalDiff >= 0
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }
                        >
                          {totalDiff >= 0 ? "+" : ""}
                          {formatHours(Math.abs(totalDiff))}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {(() => {
                      const totalActual = summaries.reduce(
                        (sum, s) => sum + s.actualHours,
                        0
                      );
                      const totalTarget = summaries.reduce(
                        (sum, s) => sum + s.targetHours,
                        0
                      );
                      const totalPercentage =
                        totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;
                      return (
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(
                            totalPercentage
                          )}`}
                        >
                          {totalPercentage.toFixed(1)}%
                        </span>
                      );
                    })()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Keine Wochensummen für diesen Zeitraum verfügbar</p>
            <p className="text-sm mt-2">
              Aktivieren Sie die Wochensummen-Anzeige in den Benutzereinstellungen
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
