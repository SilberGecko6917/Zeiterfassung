import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { LogAction, LogEntity } from "@/lib/enums";
import { IP } from "@/lib/server/auth-actions";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const entryId = parseInt((await params).id, 10);
    if (isNaN(entryId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    // Check if the entry exists and belongs to the user
    const existingEntry = await prisma.trackedTime.findUnique({
      where: { id: entryId },
    });

    if (!existingEntry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    if (existingEntry.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only update your own time entries" },
        { status: 403 }
      );
    }

    // Check if the entry is older than 7 days
    const entryDate = new Date(existingEntry.startTime);
    const now = new Date();
    const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7));

    if (entryDate < sevenDaysAgo) {
      return NextResponse.json(
        { error: "Time entries can only be modified within the last 7 days" },
        { status: 403 }
      );
    }

    const { startTime, endTime } = await request.json();

    // Validate inputs
    if (!startTime || !endTime) {
      return NextResponse.json(
        { error: "Start time and end time are required" },
        { status: 400 }
      );
    }

    // Calculate the new duration
    const start = new Date(startTime);
    const end = new Date(endTime);

    // Check if the start and end times are valid dates
    if (start < sevenDaysAgo) {
      return NextResponse.json(
        { error: "Time entries can only be set within the last 7 days" },
        { status: 400 }
      );
    }

    const durationSeconds = Math.floor(
      (end.getTime() - start.getTime()) / 1000
    );

    if (durationSeconds < 0) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      );
    }

    // Store the original date before updating
    const originalDate = new Date(existingEntry.startTime);

    // Update the time entry
    const updatedEntry = await prisma.trackedTime.update({
      where: { id: entryId },
      data: {
        startTime: start,
        endTime: end,
        duration: durationSeconds,
      },
    });

    const durationNumber = Number(updatedEntry.duration);

    await prisma.log.create({
      data: {
        userId: session.user.id,
        action: LogAction.UPDATE,
        entity: LogEntity.TIME_ENTRY,
        details: JSON.stringify({
          message: "Time entry updated by user",
          entryId: updatedEntry.id,
          startTime: updatedEntry.startTime,
          endTime: updatedEntry.endTime,
          duration: durationNumber,
          originalDate: originalDate.toISOString().split("T")[0],
          newDate: start.toISOString().split("T")[0],
        }),
        ipAddress: await IP(),
      },
    });

    return NextResponse.json({
      message: "Time entry updated successfully",
      ...updatedEntry,
      duration: durationNumber,
      dateChanged:
        originalDate.toISOString().split("T")[0] !==
        start.toISOString().split("T")[0],
    });
  } catch (error) {
    console.error("Error updating time entry:", error);
    return NextResponse.json(
      { error: "Failed to update time entry" },
      { status: 500 }
    );
  }
}
