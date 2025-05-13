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

      // Skip if no time entries
      if (timeEntries.length === 0) {
        continue;
      }

      // Calculate total work time for the day
      let totalWorkTimeMs = 0;
      let firstEntryTime = null;
      let lastEntryTime = null;
      const continuousWorkBlocks = [];
      let currentBlock = null;

      // Sort time entries chronologically
      timeEntries.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

      // Group entries into continuous work blocks
      for (const entry of timeEntries) {
        if (!entry.endTime) continue;

        const entryDuration = Number(entry.duration);
        totalWorkTimeMs += entryDuration * 1000; // Convert seconds to milliseconds

        if (!firstEntryTime || entry.startTime < firstEntryTime) {
          firstEntryTime = entry.startTime;
        }

        if (!lastEntryTime || entry.endTime > lastEntryTime) {
          lastEntryTime = entry.endTime;
        }

        // Start a new work block or add to existing one
        const MAX_GAP_MS = 30 * 60 * 1000; // 30 minutes max gap between entries to be considered continuous

        if (!currentBlock) {
          currentBlock = {
            entries: [entry],
            startTime: entry.startTime,
            endTime: entry.endTime,
            duration: entryDuration * 1000,
          };
        } else if (
          entry.startTime.getTime() - currentBlock.endTime.getTime() <=
          MAX_GAP_MS
        ) {
          // This entry is part of the current continuous block
          currentBlock.entries.push(entry);
          currentBlock.endTime = entry.endTime;
          currentBlock.duration += entryDuration * 1000;
        } else {
          // This entry starts a new block
          continuousWorkBlocks.push(currentBlock);
          currentBlock = {
            entries: [entry],
            startTime: entry.startTime,
            endTime: entry.endTime,
            duration: entryDuration * 1000,
          };
        }
      }

      // Add the last block if it exists
      if (currentBlock) {
        continuousWorkBlocks.push(currentBlock);
      }

      // Skip if not enough entries or duration (at least 6 hours of work)
      if (
        !firstEntryTime ||
        !lastEntryTime ||
        totalWorkTimeMs < 6 * 60 * 60 * 1000
      ) {
        continue;
      }

      // Find the longest continuous block that's at least 4 hours
      const MIN_BLOCK_DURATION_MS = 4 * 60 * 60 * 1000; // 4 hours minimum for adding a break
      const eligibleBlock = continuousWorkBlocks
        .filter((block) => block.duration >= MIN_BLOCK_DURATION_MS)
        .sort((a, b) => b.duration - a.duration)[0]; // Get the longest eligible block

      // Skip if no eligible block found
      if (!eligibleBlock) {
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

      // Use the block's start/end time for calculating break
      const workdayStartMs = new Date(eligibleBlock.startTime).getTime();
      const workdayEndMs = new Date(eligibleBlock.endTime).getTime();
      const workdayTotalMs = workdayEndMs - workdayStartMs;
      const workdayMiddleMs = workdayStartMs + workdayTotalMs / 2;

      // Rest of the break insertion logic stays the same but operates on this block
      const breakDurationMs = user.breakSettings.breakDuration * 60 * 1000;
      const breakStartTime = new Date(workdayMiddleMs - breakDurationMs / 2);
      const breakEndTime = new Date(workdayMiddleMs + breakDurationMs / 2);
      const breakDurationSeconds = user.breakSettings.breakDuration * 60;

      // Check if break times are within the workday
      if (
        breakStartTime < eligibleBlock.startTime ||
        breakEndTime > eligibleBlock.endTime
      ) {
        continue;
      }

      // Only delete entries from the eligible block
      const entryIdsToDelete = eligibleBlock.entries.map((entry) => entry.id);
      await prisma.trackedTime.deleteMany({
        where: {
          id: { in: entryIdsToDelete },
        },
      });

      // Calculate durations
      const firstHalfDurationSeconds = Math.floor(
        (breakStartTime.getTime() - eligibleBlock.startTime.getTime()) / 1000
      );
      const secondHalfDurationSeconds = Math.floor(
        (eligibleBlock.endTime.getTime() - breakEndTime.getTime()) / 1000
      );

      // Create two entries with break in between for this block
      // Create first half entry
      await prisma.trackedTime.create({
        data: {
          userId: user.id,
          startTime: eligibleBlock.startTime,
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
          endTime: eligibleBlock.endTime,
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
