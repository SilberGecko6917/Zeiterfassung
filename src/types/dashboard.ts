export interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
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
}
