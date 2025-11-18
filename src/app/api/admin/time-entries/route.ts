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
    const startDateParam = url.searchParams.get("startDate");
    const endDateParam = url.searchParams.get("endDate");
    const userIdParam = url.searchParams.get("userId");

    // Validate and parse dates with security checks
    let startDate: Date;
    let endDate: Date;

    try {
      if (!startDateParam || !endDateParam) {
        // Default to last 7 days if no dates provided
        endDate = new Date();
        startDate = subDays(endDate, 7);
      } else {
        // Parse dates - parseISO is safe against injection
        startDate = parseISO(startDateParam);
        endDate = parseISO(endDateParam);

        // Validate parsed dates
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          return NextResponse.json(
            { error: "Invalid date format. Use YYYY-MM-DD format" },
            { status: 400 }
          );
        }

        // max 1 year
        const daysDifference = Math.abs((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDifference > 365) {
          return NextResponse.json(
            { error: "Date range cannot exceed 365 days" },
            { status: 400 }
          );
        }

        // Validate date order
        if (startDate > endDate) {
          return NextResponse.json(
            { error: "Start date must be before or equal to end date" },
            { status: 400 }
          );
        }

        const maxFutureDate = new Date();
        maxFutureDate.setDate(maxFutureDate.getDate() + 1);
        if (startDate > maxFutureDate) {
          return NextResponse.json(
            { error: "Start date cannot be in the future" },
            { status: 400 }
          );
        }
      }
    } catch (error) {
      console.error("Date parsing error:", error);
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    // Format dates for query - use UTC to avoid timezone issues
    const formattedStart = format(startDate, "yyyy-MM-dd'T'00:00:00'Z'");
    const formattedEnd = format(endDate, "yyyy-MM-dd'T'23:59:59'Z'");

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

    // Validate and sanitize userId if provided
    if (userIdParam) {
      const userIdPattern = /^[a-zA-Z0-9_-]+$/;
      if (!userIdPattern.test(userIdParam)) {
        return NextResponse.json(
          { error: "Invalid user ID format" },
          { status: 400 }
        );
      }

      const userExists = await prisma.user.findUnique({
        where: { id: userIdParam },
        select: { id: true }
      });

      if (!userExists) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      whereClause.userId = userIdParam;
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
