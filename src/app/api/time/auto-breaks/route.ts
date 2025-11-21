import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LogAction, LogEntity } from "@/lib/enums";
import { checkIsAdmin, IP } from "@/lib/server/auth-actions";
import { startOfDayInTimezone, endOfDayInTimezone } from "@/lib/timezone";

export async function POST(request: Request) {
  try {
    // Check if the request is from an admin
    let isAuthorized = false;
    
    try {
      const isAdmin = await checkIsAdmin();
      isAuthorized = isAdmin;
    } catch (error) {
      console.error("Error checking admin status:", error);
      // Continue to check token-based auth
    }

    if (!isAuthorized) {
      const headers = request.headers;
      const authHeader = headers.get("Authorization");
      let tokenIsValid = false;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        if (token && token === process.env.CRONEJOB_KEY) {
          tokenIsValid = true;
        }
      }
      if (!tokenIsValid) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
      }
    }

    // Get date from request or use today
    const body = await request.json().catch(() => ({}));
    const targetDate = body.date ? new Date(body.date) : new Date();

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

      // Use user's timezone for day boundaries
      const userTimezone = user.timezone || 'UTC';
      const dayStart = startOfDayInTimezone(targetDate, userTimezone);
      const dayEnd = endOfDayInTimezone(targetDate, userTimezone);

      // Get all tracked time entries for the user for the target day
      const timeEntries = await prisma.trackedTime.findMany({
        where: {
          userId: user.id,
          startTime: { gte: dayStart },
          endTime: { lte: dayEnd, not: null },
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

      // Find earliest start and latest end across all entries
      const firstWithEndTime = timeEntries.find(entry => entry.endTime !== null && entry.endTime !== undefined);
      if (!firstWithEndTime) {
        // Defensive: skip if no entry has a non-null endTime
        continue;
      }
      let earliestStart = firstWithEndTime.startTime;
      let latestEnd = firstWithEndTime.endTime as Date;

      for (const entry of timeEntries) {
        if (entry.startTime < earliestStart) earliestStart = entry.startTime;
        if (entry.endTime && entry.endTime > latestEnd) latestEnd = entry.endTime;
      }

      // Calculate break time - place it in the middle of the work period
      const workStartMs = earliestStart.getTime();
      const workEndMs = latestEnd.getTime();
      const workSpanMs = workEndMs - workStartMs;
      const workMiddleMs = workStartMs + workSpanMs / 2;

      // Calculate break times
      const breakDurationMs = user.breakSettings.breakDuration * 60 * 1000;
      const breakStartTime = new Date(workMiddleMs - breakDurationMs / 2);
      const breakEndTime = new Date(workMiddleMs + breakDurationMs / 2);

      // Validate break fits within work period
      if (breakStartTime < earliestStart || breakEndTime > latestEnd) {
        console.warn(
          `Break doesn't fit for user ${user.name}: work ${earliestStart.toISOString()} - ${latestEnd.toISOString()}, break would be ${breakStartTime.toISOString()} - ${breakEndTime.toISOString()}`
        );
        continue;
      }

      // Delete all original entries
      await prisma.trackedTime.deleteMany({
        where: {
          id: { in: timeEntries.map(e => e.id) },
        },
      });

      // Reconstruct work periods with break in the middle
      // Find all periods and split them at break boundaries
      const reconstructedPeriods: Array<{ start: Date; end: Date; isBreak: boolean }> = [];
      
      for (const entry of timeEntries) {
        const entryStart = entry.startTime;
        const entryEnd = entry.endTime!;

        // Entry is completely before break
        if (entryEnd <= breakStartTime) {
          reconstructedPeriods.push({ start: entryStart, end: entryEnd, isBreak: false });
        }
        // Entry is completely after break
        else if (entryStart >= breakEndTime) {
          reconstructedPeriods.push({ start: entryStart, end: entryEnd, isBreak: false });
        }
        // Entry spans break start
        else if (entryStart < breakStartTime && entryEnd > breakStartTime) {
          // Add part before break
          reconstructedPeriods.push({ start: entryStart, end: breakStartTime, isBreak: false });
          
          // If entry also spans break end, add part after break
          if (entryEnd > breakEndTime) {
            reconstructedPeriods.push({ start: breakEndTime, end: entryEnd, isBreak: false });
          }
        }
        // Entry starts during break
        else if (entryStart >= breakStartTime && entryStart < breakEndTime) {
          // Only add part after break if any
          if (entryEnd > breakEndTime) {
            reconstructedPeriods.push({ start: breakEndTime, end: entryEnd, isBreak: false });
          }
        }
      }

      // Add the break
      reconstructedPeriods.push({ start: breakStartTime, end: breakEndTime, isBreak: true });

      // Sort by start time
      reconstructedPeriods.sort((a, b) => a.start.getTime() - b.start.getTime());

      // Create all new entries from sorted array
      let breakEntry: Awaited<ReturnType<typeof prisma.trackedTime.create>> | null = null;
      for (const period of reconstructedPeriods) {
        const durationSeconds = Math.floor(
          (period.end.getTime() - period.start.getTime()) / 1000
        );
        
        const entry = await prisma.trackedTime.create({
          data: {
            userId: user.id,
            startTime: period.start,
            endTime: period.end,
            duration: BigInt(durationSeconds),
            isBreak: period.isBreak,
          },
        });

        // Keep reference to break entry for logging
        if (period.isBreak) {
          breakEntry = entry;
        }
      }

      // Ensure we have a break entry (should always be true)
      if (!breakEntry) {
        console.error(`No break entry created for user ${user.name}`);
        continue;
      }

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
            originalEntriesCount: timeEntries.length,
            timezone: userTimezone,
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
        entriesProcessed: timeEntries.length,
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
      { success: false, error: "Failed to insert automatic breaks" },
      { status: 500 }
    );
  }
}
