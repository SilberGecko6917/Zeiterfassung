import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getUserTimezone } from "@/lib/server/timezone";
import { startOfDayInTimezone, endOfDayInTimezone } from "@/lib/timezone";
import { formatInTimeZone } from "date-fns-tz";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's timezone
    const timezone = await getUserTimezone();

    // Get date from query param
    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get("date");

    let dateForQuery: Date | string;
    if (dateParam) {
      dateForQuery = dateParam;
    } else {
      dateForQuery = new Date();
    }

    const dayStart = startOfDayInTimezone(dateForQuery, timezone);
    const dayEnd = endOfDayInTimezone(dateForQuery, timezone);

    // Find entries that overlap with the specified date
    // This will include entries that:
    // 1. Start before or on this day AND end on or after this day's start
    // OR
    // 2. Start on this day (regardless of when they end)
    const entries = await prisma.trackedTime.findMany({
      where: {
        userId: session.user.id,
        // One of these conditions must be true for the entry to be included
        OR: [
          // Condition 1: Entry starts on the selected day
          {
            startTime: {
              gte: dayStart,
              lte: dayEnd,
            },
            endTime: {
              not: null,
            },
          },
          // Condition 2: Entry ends on the selected day
          {
            endTime: {
              gte: dayStart,
              lte: dayEnd,
            },
          },
          // Condition 3: Entry spans over the selected day
          {
            startTime: {
              lt: dayStart,
            },
            endTime: {
              gt: dayEnd,
            },
          },
        ],
      },
      orderBy: {
        startTime: "asc",
      },
    });

    // Add a field to indicate if the entry spans multiple days
    // Convert to user's timezone for display
    const entriesWithMetadata = entries.map((entry) => {
      const startDateStr = formatInTimeZone(entry.startTime, timezone, 'yyyy-MM-dd');
      const endDateStr = entry.endTime ? formatInTimeZone(entry.endTime, timezone, 'yyyy-MM-dd') : null;

      let isMultiDay = false;
      if (endDateStr) {
        isMultiDay = startDateStr !== endDateStr;
      }

      // Calculate the duration for just this day's portion
      let dayDuration = Number(entry.duration);

      if (isMultiDay && entry.endTime) {
        const displayStart = entry.startTime.getTime() < dayStart.getTime() ? dayStart : entry.startTime;
        const displayEnd = entry.endTime.getTime() > dayEnd.getTime() ? dayEnd : entry.endTime;

        // Calculate the visual duration for this day's part
        const dayPortion = Math.floor(
          (displayEnd.getTime() - displayStart.getTime()) / 1000
        );
        dayDuration = dayPortion;
      }

      const durationNumber = Number(entry.duration);

      return {
        ...entry,
        startTime: entry.startTime.toISOString(),
        endTime: entry.endTime?.toISOString(),
        duration: durationNumber,
        isMultiDay,
        dayDuration,
        isStartDay: entry.startTime >= dayStart && entry.startTime <= dayEnd,
        isEndDay: entry.endTime ? (entry.endTime >= dayStart && entry.endTime <= dayEnd) : false,
        displayDate: typeof dateForQuery === 'string' ? dateForQuery : formatInTimeZone(dateForQuery, timezone, 'yyyy-MM-dd'),
      };
    });

    return NextResponse.json({ entries: entriesWithMetadata });
  } catch (error) {
    console.error("Error fetching time entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch time entries" },
      { status: 500 }
    );
  }
}
