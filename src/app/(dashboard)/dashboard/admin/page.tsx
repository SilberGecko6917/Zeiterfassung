"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardStats, TimeEntry, UserData } from "@/types/dashboard";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Calendar, Clock, PieChart, Users } from "lucide-react";
import { useState } from "react";

export default function AdminHomePage() {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeTracking: 0,
    todayMinutesWorked: 0,
    weeklyHours: 0,
  });

  // Format minutes as readable time
  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
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

  return (
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
              <div className="text-3xl font-bold">{stats.totalUsers}</div>
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
              <div className="text-3xl font-bold">{stats.activeTracking}</div>
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
                        {format(new Date(entry.startTime), "dd.MM.yyyy", {
                          locale: de,
                        })}
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
          {stats.totalUsers > 0 ? (
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
                      <td className="py-3 px-4 font-medium">{user.name}</td>
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
                        {format(new Date(vacation.startDate), "dd.MM.yyyy", {
                          locale: de,
                        })}{" "}
                        -<br />
                        {format(new Date(vacation.endDate), "dd.MM.yyyy", {
                          locale: de,
                        })}
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
  );
}
