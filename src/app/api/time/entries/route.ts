import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { startOfDay, endOfDay } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get date from query param
    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get("date");

    let date: Date;
    if (dateParam) {
      date = new Date(dateParam);
    } else {
      date = new Date();
    }

    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

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
    const entriesWithMetadata = entries.map((entry) => {
      const startDate = new Date(entry.startTime);
      const endDate = new Date(entry.endTime as Date);

      const isMultiDay =
        startDate.getDate() !== endDate.getDate() ||
        startDate.getMonth() !== endDate.getMonth() ||
        startDate.getFullYear() !== endDate.getFullYear();

      // Calculate the duration for just this day's portion
      let dayDuration = Number(entry.duration);

      if (isMultiDay) {
        // If entry starts before the current day, adjust the visual start time
        const displayStart = startDate < dayStart ? dayStart : startDate;
        // If entry ends after the current day, adjust the visual end time
        const displayEnd = endDate > dayEnd ? dayEnd : endDate;

        // Calculate the visual duration for this day's part
        const dayPortion = Math.floor(
          (displayEnd.getTime() - displayStart.getTime()) / 1000
        );
        dayDuration = dayPortion;
      }

      const durationNumber = Number(entry.duration);

      return {
        ...entry,
        duration: durationNumber,
        isMultiDay,
        dayDuration,
        isStartDay: startDate >= dayStart && startDate <= dayEnd,
        isEndDay: endDate >= dayStart && endDate <= dayEnd,
        displayDate: date.toISOString().split("T")[0],
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
