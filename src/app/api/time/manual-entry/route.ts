import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { IP } from "@/lib/server/auth-actions";
import { LogAction, LogEntity } from "@/lib/enums";
import { nowUTC, calculateDuration } from "@/lib/timezone";
import { parseISO, subDays } from "date-fns";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { startTime, endTime } = await request.json();

    if (!startTime || !endTime) {
      return NextResponse.json(
        { error: "Start time and end time are required" },
        { status: 400 }
      );
    }

    // Parse dates - client must send ISO 8601 strings in UTC (e.g., "2024-06-01T12:00:00Z")
    // The server expects UTC ISO strings and parses them as UTC
    const start = parseISO(startTime);
    const end = parseISO(endTime);
    const now = nowUTC();

    // Prevent entries in the future
    if (start > now || end > now) {
      return NextResponse.json(
        { error: "Time entries cannot be in the future" },
        { status: 400 }
      );
    }

    // Check if entry is more than 7 days in the past
    const sevenDaysAgo = subDays(now, 7);

    if (start < sevenDaysAgo || end < sevenDaysAgo) {
      return NextResponse.json(
        { error: "Time entries cannot be more than 7 days in the past" },
        { status: 400 }
      );
    }

    // Calculate duration in seconds
    const durationSeconds = calculateDuration(start, end);

    if (durationSeconds <= 0) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      );
    }

    // Create time entry
    const timeEntry = await prisma.trackedTime.create({
      data: {
        userId: session.user.id,
        startTime: start,
        endTime: end,
        duration: durationSeconds,
      },
    });

    // Log the manual entry
    await prisma.log.create({
      data: {
        userId: session.user.id,
        action: LogAction.CREATE,
        entity: LogEntity.TIME_ENTRY,
        details: JSON.stringify({
          message: "Manual time entry created",
          entryId: timeEntry.id,
          startTime: start,
          endTime: end,
          duration: durationSeconds,
        }),
        ipAddress: await IP(),
      },
    });

    return NextResponse.json({
      message: "Manual time entry created",
      timeEntry: {
        ...timeEntry,
        startTime: timeEntry.startTime.toISOString(),
        endTime: timeEntry.endTime?.toISOString(),
        duration: Number(timeEntry.duration),
      },
    });
  } catch (error) {
    console.error("Error creating manual time entry:", error);
    return NextResponse.json(
      { error: "Failed to create manual time entry" },
      { status: 500 }
    );
  }
}
