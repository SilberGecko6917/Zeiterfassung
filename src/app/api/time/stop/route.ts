import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { LogAction, LogEntity } from "@/lib/enums";
import { IP } from "@/lib/server/auth-actions";
import { nowUTC, calculateDuration } from "@/lib/timezone";
import { formatTimeEntryResponse } from "@/lib/format-time-entry";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find active tracking session
    const activeSession = await prisma.trackedTime.findFirst({
      where: {
        userId: session.user.id,
        endTime: null,
      },
    });

    if (!activeSession) {
      return NextResponse.json(
        { error: "No active tracking session found" },
        { status: 400 }
      );
    }

    // Calculate duration and update the session - using UTC
    const endTime = nowUTC();
    const durationSeconds = calculateDuration(activeSession.startTime, endTime);

    const updatedSession = await prisma.trackedTime.update({
      where: { id: activeSession.id },
      data: {
        endTime,
        duration: durationSeconds,
      },
    });

    const formattedSession = formatTimeEntryResponse(updatedSession);

    await prisma.log.create({
      data: {
        userId: session.user.id,
        action: LogAction.STOP_TRACKING,
        entity: LogEntity.USER,
        details: JSON.stringify({
          message: "Time tracking stopped",
          endTime: endTime.toISOString(),
          duration: durationSeconds,
        }),
        ipAddress: await IP(),
      },
    });

    return NextResponse.json({
      message: "Time tracking stopped",
      session: formattedSession,
    });
  } catch (error) {
    console.error("Error stopping time tracking:", error);
    return NextResponse.json(
      { error: "Failed to stop time tracking" },
      { status: 500 }
    );
  }
}
