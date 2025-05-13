import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { LogAction, LogEntity } from "@/lib/enums";
import { IP } from "@/lib/server/auth-actions";

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

    // Calculate duration and update the session
    const endTime = new Date();
    const startTime = new Date(activeSession.startTime);
    const durationSeconds = Number(
      Math.floor((endTime.getTime() - startTime.getTime()) / 1000)
    );

    const updatedSession = await prisma.trackedTime.update({
      where: { id: activeSession.id },
      data: {
        endTime,
        duration: durationSeconds,
      },
    });

    const formattedSession = {
      ...updatedSession,
      duration: durationSeconds,
    };

    await prisma.log.create({
      data: {
        userId: session.user.id,
        action: LogAction.STOP_TRACKING,
        entity: LogEntity.USER,
        details: JSON.stringify({
          message: "Time tracking stopped",
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
