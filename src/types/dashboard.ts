export interface UserData {
  id: string;
  name: string;
  email: string;
  role: "USER" | "MANAGER" | "ADMIN";
  createdAt?: string;
  updatedAt?: string;
}

export interface TimeEntry {
  id: number;
  userId: string;
  user?: {
    name: string;
    email?: string;
  };
  startTime: string | Date;
  endTime: string | Date | null;
  duration: number | bigint;
  isBreak?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface BreakSetting {
  userId: string;
  breakDuration: number;
  autoInsert: boolean;
}

export interface VacationData {
  id: number;
  userId: string;
  userName?: string;
  startDate: string;
  endDate: string;
  days: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  note?: string;
  createdAt: string;
  updatedAt?: string;
  user?: UserData;
}

export interface DashboardStats {
  totalUsers: number;
  activeTracking: number;
  todayMinutesWorked: number;
  weeklyHours: number;
  upcomingVacations?: VacationData[];
}

export interface Setting {
  key: string;
  value: string;
  label: string;
  description?: string;
}

export interface LogEntry {
  id: string;
  userId?: string;
  userName?: string;
  action: string;
  details?: string;
  timestamp: string;
  ip?: string;
  userAgent?: string;
}
