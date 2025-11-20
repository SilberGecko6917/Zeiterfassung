import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkIsAdmin, checkPermission } from "@/lib/server/auth-actions";
import { startOfWeek, addDays } from "date-fns";
import { getUserTimezone } from "@/lib/server/timezone";
import { startOfDayInTimezone, endOfDayInTimezone, nowUTC, fromUTC } from "@/lib/timezone";

export async function GET() {
  try {
    // Check if user has permission - admin or manager with view_all_reports permission
    const isAdmin = await checkIsAdmin();
    const hasReportPermission = await checkPermission("view_all_reports");

    if (!isAdmin && !hasReportPermission) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get user timezone
    const timezone = await getUserTimezone();
    const today = nowUTC();
    
    // Get today's date boundaries in user's timezone, converted to UTC
    const startToday = startOfDayInTimezone(today, timezone);
    const endToday = endOfDayInTimezone(today, timezone);

    // Get start of current week in user's timezone
    const todayUserTZ = fromUTC(today, timezone);
    const startWeekUserTZ = startOfWeek(todayUserTZ, { weekStartsOn: 1 }); // Monday as week start
    const startWeek = startOfDayInTimezone(startWeekUserTZ, timezone);

    // Count total users
    const totalUsers = await prisma.user.count();

    // Count active tracking sessions
    const activeTracking = await prisma.trackedTime.count({
      where: {
        startTime: {
          gte: startToday,
          lte: endToday,
        },
        endTime: null,
      },
    });

    // Calculate today's worked minutes
    const todayEntries = await prisma.trackedTime.findMany({
      where: {
        OR: [
          // Completed entries for today
          {
            startTime: {
              gte: startToday,
              lte: endToday,
            },
            endTime: { not: null },
            isBreak: false,
          },
          // Active tracking sessions
          {
            startTime: {
              gte: startToday,
              lte: endToday,
            },
            endTime: null,
          },
        ],
      },
    });

    let todayMinutesWorked = 0;

    todayEntries.forEach((entry) => {
      if (entry.endTime) {
        // Completed entries - use recorded duration
        todayMinutesWorked += Math.floor(Number(entry.duration) / 60);
      } else {
        // Active sessions - calculate from start until now
        const durationInMinutes = Math.floor(
          (today.getTime() - new Date(entry.startTime).getTime()) / (1000 * 60)
        );
        todayMinutesWorked += durationInMinutes;
      }
    });

    // Calculate weekly hours
    const weeklyEntries = await prisma.trackedTime.findMany({
      where: {
        startTime: {
          gte: startWeek,
        },
        endTime: { not: null },
        isBreak: false, // Exclude breaks from working time
      },
    });

    let weeklySeconds = 0;

    weeklyEntries.forEach((entry) => {
      weeklySeconds += Number(entry.duration);
    });

    const weeklyHours = weeklySeconds / 3600;

    // Find upcoming vacations for the next 30 days
    const thirtyDaysFromNow = addDays(todayUserTZ, 30);
    const upcomingVacations = await prisma.vacation.findMany({
      where: {
        status: "approved",
        startDate: {
          lte: thirtyDaysFromNow,
        },
        endDate: {
          gte: todayUserTZ,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        startDate: "asc",
      },
    });

    return NextResponse.json({
      totalUsers,
      activeTracking,
      todayMinutesWorked,
      weeklyHours,
      upcomingVacations: upcomingVacations.map(v => ({
        id: v.id,
        userId: v.userId,
        userName: v.user?.name || "",
        startDate: v.startDate.toISOString(),
        endDate: v.endDate.toISOString(),
        days: v.days,
        status: v.status,
      })),
    });
  } catch (error) {
    console.error("Error fetching admin statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
