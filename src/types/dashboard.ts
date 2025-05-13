export interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  vacationDaysPerYear?: number;
  vacationDaysTaken?: number;
}

export interface TimeEntry {
  id: number;
  userId: string;
  userName: string;
  startTime: string;
  endTime: string;
  duration: number;
  isBreak: boolean;
}

export interface DashboardStats {
  totalUsers: number;
  activeTracking: number;
  todayMinutesWorked: number;
  weeklyHours: number;
  upcomingVacations?: VacationData[];
}

export interface VacationData {
  id: number;
  userId: string;
  userName?: string;
  startDate: string;
  endDate: string;
  days: number;
  status: "pending" | "approved" | "rejected";
  description?: string;
  createdAt: string;
}
