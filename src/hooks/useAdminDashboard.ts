import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { TrackedTime, User } from '@prisma/client'
import { DashboardStats, UserData } from '@/types/dashboard';

export function useAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeTracking: 0,
    todayMinutesWorked: 0,
    weeklyHours: 0,
    upcomingVacations: []
  });
  const [users, setUsers] = useState<User[]>([]);
  const [timeEntries, setTimeEntries] = useState<TrackedTime[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Fetch dashboard stats
      const statsResponse = await fetch("/api/admin/stats");
      const statsData = await statsResponse.json();
      setStats({
        totalUsers: statsData.totalUsers || 0,
        activeTracking: statsData.activeTracking || 0,
        todayMinutesWorked: statsData.todayMinutesWorked || 0,
        weeklyHours: statsData.weeklyHours || 0,
        upcomingVacations: statsData.upcomingVacations || [],
      });

      // Fetch recent users
      const usersResponse = await fetch("/api/admin/users");
      const usersData = await usersResponse.json();
      setUsers(usersData.users || []);

      // Fetch recent time entries
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 7);
      
      const timeEntriesResponse = await fetch(
        `/api/admin/time-entries?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`
      );
      const timeEntriesData = await timeEntriesResponse.json();
      setTimeEntries(timeEntriesData.entries || []);
      
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast.error("Fehler beim Laden der Dashboard-Daten");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    stats,
    users,
    timeEntries,
    isLoading,
    fetchData
  };
}