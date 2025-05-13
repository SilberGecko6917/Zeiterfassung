import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";
import { LogAction, LogEntity } from "@/lib/enums";
import { checkIsAdmin, IP } from "@/lib/server/auth-actions";

export async function POST(request: Request) {
  // Check if the request is from an admin
  const isAdmin = await checkIsAdmin();

  if (!isAdmin) {
    const headers = request.headers;
    const authHeader = headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (token !== process.env.CRONEJOB_KEY)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get date from request or use today
    const body = await request.json().catch(() => ({}));
    const targetDate = body.date ? new Date(body.date) : new Date();

    const dayStart = startOfDay(targetDate);
    const dayEnd = endOfDay(targetDate);

    // Get all users with break settings
    const usersWithBreakSettings = await prisma.user.findMany({
      include: {
        breakSettings: true,
      },
    });

    const results = [];

    for (const user of usersWithBreakSettings) {
      // Skip if user has no break settings or auto-insert is disabled
      if (!user.breakSettings || !user.breakSettings.autoInsert) {
        continue;
      }

      // Get all tracked time entries for the user for the target day
      const timeEntries = await prisma.trackedTime.findMany({
        where: {
          userId: user.id,
          startTime: { gte: dayStart },
          endTime: { lte: dayEnd },
          isBreak: false, // Exclude existing breaks
        },
        orderBy: {
          startTime: "asc",
        },
      });

      // Skip if no time entries or more than one time entry
      if (timeEntries.length !== 1) {
        continue;
      }

      // Get the single time entry
      const singleEntry = timeEntries[0];
      
      // Skip if there's no end time
      if (!singleEntry.endTime) {
        continue;
      }

      // Check if break already exists
      const existingBreak = await prisma.trackedTime.findFirst({
        where: {
          userId: user.id,
          startTime: { gte: dayStart },
          endTime: { lte: dayEnd },
          isBreak: true,
        },
      });

      if (existingBreak) {
        continue;
      }

      // Calculate break time based on the single entry
      const entryStartMs = new Date(singleEntry.startTime).getTime();
      const entryEndMs = new Date(singleEntry.endTime).getTime();
      const entryDurationMs = entryEndMs - entryStartMs;
      const entryMiddleMs = entryStartMs + entryDurationMs / 2;

      // Calculate break times
      const breakDurationMs = user.breakSettings.breakDuration * 60 * 1000;
      const breakStartTime = new Date(entryMiddleMs - breakDurationMs / 2);
      const breakEndTime = new Date(entryMiddleMs + breakDurationMs / 2);
      const breakDurationSeconds = user.breakSettings.breakDuration * 60;

      // Check if break times are within the entry timeframe
      if (
        breakStartTime < singleEntry.startTime ||
        breakEndTime > singleEntry.endTime
      ) {
        continue;
      }

      // Calculate durations for the two parts
      const firstHalfDurationSeconds = Math.floor(
        (breakStartTime.getTime() - entryStartMs) / 1000
      );
      const secondHalfDurationSeconds = Math.floor(
        (entryEndMs - breakEndTime.getTime()) / 1000
      );

      // Delete the original entry
      await prisma.trackedTime.delete({
        where: {
          id: singleEntry.id,
        },
      });

      // Create first half entry
      await prisma.trackedTime.create({
        data: {
          userId: user.id,
          startTime: singleEntry.startTime,
          endTime: breakStartTime,
          duration: BigInt(firstHalfDurationSeconds),
          isBreak: false,
        },
      });

      // Insert the break
      const breakEntry = await prisma.trackedTime.create({
        data: {
          userId: user.id,
          startTime: breakStartTime,
          endTime: breakEndTime,
          duration: BigInt(breakDurationSeconds),
          isBreak: true,
        },
      });

      // Create second half entry
      await prisma.trackedTime.create({
        data: {
          userId: user.id,
          startTime: breakEndTime,
          endTime: singleEntry.endTime,
          duration: BigInt(secondHalfDurationSeconds),
          isBreak: false,
        },
      });

      // Log this action
      await prisma.log.create({
        data: {
          userId: user.id,
          action: LogAction.AUTO_BREAK_ADDED,
          entity: LogEntity.BREAK,
          entityId: String(breakEntry.id),
          details: JSON.stringify({
            breakDuration: user.breakSettings.breakDuration,
            breakStartTime: breakStartTime.toISOString(),
            breakEndTime: breakEndTime.toISOString(),
          }),
          ipAddress: await IP(),
        },
      });

      results.push({
        userId: user.id,
        userName: user.name,
        breakId: breakEntry.id,
        breakStartTime: breakStartTime,
        breakEndTime: breakEndTime,
        breakDuration: user.breakSettings.breakDuration,
      });
    }

    return NextResponse.json({
      success: true,
      processedUsers: results.length,
      breaks: results,
    });
  } catch (error) {
    console.error("Error inserting automatic breaks:", error);
    return NextResponse.json(
      { error: "Failed to insert automatic breaks" },
      { status: 500 }
    );
  }
}
