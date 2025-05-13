import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkIsAdmin, IP } from "@/lib/server/auth-actions";
import { LogAction, LogEntity } from "@/lib/enums";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await checkIsAdmin();
    const session = await getServerSession(authOptions);

    if (!isAdmin || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const { id } = await params;
    const entryId = parseInt(id);
    const body = await request.json();
    const { startTime, endTime, duration } = body;

    // Validate input
    if (!startTime || !endTime || duration === undefined) {
      return NextResponse.json(
        { error: "Start time, end time, and duration are required" },
        { status: 400 }
      );
    }

    // Parse date strings to Date objects
    const parsedStartTime = new Date(startTime);
    const parsedEndTime = new Date(endTime);
    const now = new Date();

    // Prevent entries in the future
    if (parsedStartTime > now || parsedEndTime > now) {
      return NextResponse.json(
        { error: "Time entries cannot be in the future" },
        { status: 400 }
      );
    }

    // Check if entry is more than 7 days in the past
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    if (parsedStartTime < sevenDaysAgo || parsedEndTime < sevenDaysAgo) {
      return NextResponse.json(
        { error: "Time entries cannot be more than 7 days in the past" },
        { status: 400 }
      );
    }

    // Check if time entry exists
    const timeEntry = await prisma.trackedTime.findUnique({
      where: { id: entryId },
    });

    // Return error if time entry doesn't exist
    if (!timeEntry) {
      return NextResponse.json(
        { error: "Time entry not found" },
        { status: 404 }
      );
    }

    // Update time entry
    const updatedEntry = await prisma.trackedTime.update({
      where: { id: entryId },
      data: {
        startTime: parsedStartTime,
        endTime: parsedEndTime,
        duration,
      },
    });

    // Convert BigInt values to Number before JSON serialization
    const serializedEntry = {
      ...updatedEntry,
      duration: Number(updatedEntry.duration),
    };

    await prisma.log.create({
      data: {
        userId: session.user.id,
        action: LogAction.UPDATE,
        entity: LogEntity.TIME_ENTRY,
        details: JSON.stringify({
          message: "Time entry updated",
          timeEntry: {
            id: serializedEntry.id,
            startTime: serializedEntry.startTime,
            endTime: serializedEntry.endTime,
            duration: serializedEntry.duration,
            userId: serializedEntry.userId,
          },
        }),
        ipAddress: await IP(),
      },
    });

    return NextResponse.json({
      message: "Time entry updated successfully",
      timeEntry: serializedEntry,
    });
  } catch (error) {
    console.error("Error updating time entry:", error);
    return NextResponse.json(
      { error: "Failed to update time entry" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const isAdmin = await checkIsAdmin();

    if (!isAdmin || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const entryId = parseInt((await params).id);
    if (isNaN(entryId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    // Get the time entry before deletion
    const timeEntry = await prisma.trackedTime.findUnique({
      where: { id: entryId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!timeEntry) {
      return NextResponse.json(
        { error: "Time entry not found" },
        { status: 404 }
      );
    }

    // Delete the time entry
    await prisma.trackedTime.delete({
      where: { id: entryId },
    });

    // Create log
    await prisma.log.create({
      data: {
        userId: session.user.id,
        action: LogAction.DELETE,
        entity: LogEntity.TIME_ENTRY,
        details: JSON.stringify({
          message: "Time entry deleted by admin",
          entryId,
          userId: timeEntry.userId,
          startTime: timeEntry.startTime,
          endTime: timeEntry.endTime,
          duration: Number(timeEntry.duration),
          user: {
            id: timeEntry.userId,
            name: timeEntry.user?.name,
            email: timeEntry.user?.email,
          },
        }),
        ipAddress: await IP(),
      },
    });

    return NextResponse.json({
      message: "Time entry deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting time entry:", error);
    return NextResponse.json(
      { error: "Failed to delete time entry" },
      { status: 500 }
    );
  }
}
