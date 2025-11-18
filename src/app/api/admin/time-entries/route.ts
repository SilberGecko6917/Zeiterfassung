import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkIsAdmin, checkPermission, IP } from "@/lib/server/auth-actions";
import { format, parseISO, subDays } from "date-fns";
import { LogAction, LogEntity } from "@/lib/enums";

export async function GET(request: NextRequest) {
  try {
    // Check if user has permission - admin or manager with view_all_time permission
    const isAdmin = await checkIsAdmin();
    const hasViewPermission = await checkPermission("view_all_time");

    if (!isAdmin && !hasViewPermission) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get query parameters
    const url = new URL(request.url);
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const userId = url.searchParams.get("userId");

    // Default to last 7 days if no dates provided
    const end = endDate ? parseISO(endDate) : new Date();
    const start = startDate ? parseISO(startDate) : subDays(end, 7);

    // Format dates for query
    const formattedStart = format(start, "yyyy-MM-dd'T'00:00:00'Z'");
    const formattedEnd = format(end, "yyyy-MM-dd'T'23:59:59'Z'");

    // Build the where clause with conditional userId filter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {
      startTime: {
        gte: formattedStart,
        lte: formattedEnd,
      },
      endTime: {
        not: null,
      },
    };

    // Add userId filter if provided
    if (userId) {
      whereClause.userId = userId;
    }

    // Get time entries with user info
    const entries = await prisma.trackedTime.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [{ startTime: "desc" }, { userId: "asc" }],
    });

    // Transform entries to include username
    const formattedEntries = entries.map((entry) => ({
      id: entry.id,
      userId: entry.userId,
      userName: entry.user.name,
      startTime: entry.startTime,
      endTime: entry.endTime,
      duration: Number(entry.duration),
      isBreak: entry.isBreak,
    }));

    return NextResponse.json({ entries: formattedEntries });
  } catch (error) {
    console.error("Error fetching time entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch time entries" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await checkIsAdmin();

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { userId, startTime, endTime, duration } = await request.json();

    if (!userId || !startTime || !endTime || duration === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create time entry
    const timeEntry = await prisma.trackedTime.create({
      data: {
        userId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        duration,
      },
    });

    // Get user info for logging
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    // Create log
    await prisma.log.create({
      data: {
        userId: userId,
        action: LogAction.CREATE,
        entity: LogEntity.TIME_ENTRY,
        details: JSON.stringify({
          message: "Time entry created by admin",
          entryId: timeEntry.id,
          startTime,
          endTime,
          duration,
          user: {
            id: userId,
            name: user?.name,
            email: user?.email,
          },
        }),
        ipAddress: await IP(),
      },
    });

    return NextResponse.json({
      message: "Time entry created successfully",
      timeEntry: {
        ...timeEntry,
        duration: Number(timeEntry.duration),
      },
    });
  } catch (error) {
    console.error("Error creating time entry:", error);
    return NextResponse.json(
      { error: "Failed to create time entry" },
      { status: 500 }
    );
  }
}
