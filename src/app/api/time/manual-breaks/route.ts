import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LogAction, LogEntity } from "@/lib/enums";
import { IP } from "@/lib/server/auth-actions";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    // Get the current user ID
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    // Get break data from request body
    const body = await request.json();
    const { startTime, endTime, date } = body;

    if (!startTime || !endTime || !date) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Parse times and calculate duration
    const breakStartTime = new Date(`${date}T${startTime}`);
    const breakEndTime = new Date(`${date}T${endTime}`);
    
    // Validate end time is after start time
    if (breakEndTime <= breakStartTime) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      );
    }

    const breakDurationSeconds = Math.floor(
      (breakEndTime.getTime() - breakStartTime.getTime()) / 1000
    );

    // Create the manual break entry
    const breakEntry = await prisma.trackedTime.create({
      data: {
        userId,
        startTime: breakStartTime,
        endTime: breakEndTime,
        duration: BigInt(breakDurationSeconds),
        isBreak: true,
      },
    });

    // Log this action
    await prisma.log.create({
      data: {
        userId,
        action: LogAction.MANUAL_BREAK_ADDED,
        entity: LogEntity.BREAK,
        entityId: String(breakEntry.id),
        details: JSON.stringify({
          breakStartTime: breakStartTime.toISOString(),
          breakEndTime: breakEndTime.toISOString(),
          durationSeconds: breakDurationSeconds
        }),
        ipAddress: await IP(),
      },
    });

    return NextResponse.json({
      success: true,
      break: breakEntry,
    });
  } catch (error) {
    console.error("Error adding manual break:", error);
    return NextResponse.json(
      { error: "Failed to add manual break" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    // Get the current user ID
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const { searchParams } = new URL(request.url);
    const breakId = searchParams.get("id");

    if (!breakId) {
      return NextResponse.json(
        { error: "Break ID is required" },
        { status: 400 }
      );
    }

    // Verify the break belongs to the user
    const existingBreak = await prisma.trackedTime.findFirst({
      where: {
        id: Number(breakId),
        userId,
        isBreak: true,
      },
    });

    if (!existingBreak) {
      return NextResponse.json(
        { error: "Break not found or unauthorized" },
        { status: 404 }
      );
    }

    // Delete the break
    await prisma.trackedTime.delete({
      where: {
        id: Number(breakId),
      },
    });

    // Log this action
    await prisma.log.create({
      data: {
        userId,
        action: LogAction.BREAK_DELETED,
        entity: LogEntity.BREAK,
        entityId: breakId,
        ipAddress: await IP(),
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Error deleting break:", error);
    return NextResponse.json(
      { error: "Failed to delete break" },
      { status: 500 }
    );
  }
}