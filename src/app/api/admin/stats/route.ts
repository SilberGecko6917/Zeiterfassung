import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkIsAdmin } from "@/lib/server/auth-actions";
import { startOfDay, endOfDay, startOfWeek } from "date-fns";

export async function GET() {
  try {
    const isAdmin = await checkIsAdmin();

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get today's date boundaries
    const today = new Date();
    const startToday = startOfDay(today);
    const endToday = endOfDay(today);

    // Get start of current week
    const startWeek = startOfWeek(today, { weekStartsOn: 1 }); // Monday as week start

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

    return NextResponse.json({
      totalUsers,
      activeTracking,
      todayMinutesWorked,
      weeklyHours,
    });
  } catch (error) {
    console.error("Error fetching admin statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
