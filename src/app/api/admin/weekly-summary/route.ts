import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkIsAdmin } from "@/lib/server/auth-actions";
import { getISOWeek, getYear, parseISO } from "date-fns";
import { startOfDayInTimezone, endOfDayInTimezone, formatDateInTimezone } from "@/lib/timezone";

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

// GET /api/admin/weekly-summary - Get weekly summary for all users or specific user
export async function GET(request: NextRequest) {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const weekParam = searchParams.get("week"); // format: ISO date string
    
    // Determine the week to query
    let targetDate = new Date();
    if (weekParam) {
      targetDate = parseISO(weekParam);
    }

    const weekNumber = getISOWeek(targetDate);
    const year = getYear(targetDate);
    
    // Calculate Monday of the target week
    const dayOfWeek = targetDate.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(targetDate);
    monday.setDate(targetDate.getDate() - daysFromMonday);
    
    // Calculate Sunday of the target week
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    // Format dates for response
    const weekStartStr = formatDateInTimezone(monday, "UTC", "yyyy-MM-dd");
    const weekEndStr = formatDateInTimezone(sunday, "UTC", "yyyy-MM-dd");

    // Build user filter
    const userFilter = userId ? { id: userId } : {};

    // Fetch users with their settings
    const users = await prisma.user.findMany({
      where: userFilter,
      select: {
        id: true,
        name: true,
        email: true,
        showWeeklySummary: true,
        weeklyTargetHours: true,
        timezone: true,
      },
    });

    const summaries: UserWeeklySummary[] = [];

    for (const user of users) {
      // Calculate week boundaries in user's timezone
      const userWeekStart = startOfDayInTimezone(monday, user.timezone);
      const userWeekEnd = endOfDayInTimezone(sunday, user.timezone);
      
      // Fetch time entries for this user in the specified week
      const timeEntries = await prisma.trackedTime.findMany({
        where: {
          userId: user.id,
          startTime: {
            gte: userWeekStart,
            lte: userWeekEnd,
          },
          isBreak: false, // Exclude breaks from work hours
        },
      });

      // Calculate total hours worked
      const totalSeconds = timeEntries.reduce((sum, entry) => {
        return sum + Number(entry.duration);
      }, 0);

      const actualHours = totalSeconds / 3600; // Convert seconds to hours
      const targetHours = user.weeklyTargetHours;
      const difference = actualHours - targetHours;
      const percentage = targetHours > 0 ? (actualHours / targetHours) * 100 : 0;

      summaries.push({
        userId: user.id,
        userName: user.name || "Unbekannt",
        email: user.email,
        weekNumber,
        year,
        actualHours: Math.round(actualHours * 100) / 100, // Round to 2 decimals
        targetHours,
        difference: Math.round(difference * 100) / 100,
        percentage: Math.round(percentage * 100) / 100,
        showWeeklySummary: user.showWeeklySummary,
      });
    }

    return NextResponse.json({
      summaries,
      week: {
        number: weekNumber,
        year,
        start: weekStartStr,
        end: weekEndStr,
        label: `KW ${weekNumber} ${year}`,
      },
    });
  } catch (error) {
    console.error("Error fetching weekly summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch weekly summary" },
      { status: 500 }
    );
  }
}
