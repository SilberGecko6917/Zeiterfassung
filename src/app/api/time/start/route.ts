import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { LogAction, LogEntity } from "@/lib/enums";
import { IP } from "@/lib/server/auth-actions";
import { nowUTC } from "@/lib/timezone";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user already has an active session
    const activeSession = await prisma.trackedTime.findFirst({
      where: {
        userId: session.user.id,
        endTime: null,
      },
    });

    if (activeSession) {
      return NextResponse.json(
        { error: "User already has an active tracking session" },
        { status: 400 }
      );
    }

    // Start new tracking session - store in UTC
    const startTime = nowUTC();

    await prisma.trackedTime.create({
      data: {
        userId: session.user.id,
        startTime,
        endTime: null,
        duration: 0,
      },
    });

    await prisma.log.create({
      data: {
        userId: session.user.id,
        action: LogAction.START_TRACKING,
        entity: LogEntity.TIME_ENTRY,
        details: JSON.stringify({
          message: "Time tracking started",
          startTime: startTime.toISOString(),
          user: {
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
            role: session.user.role,
          },
        }),
        ipAddress: await IP(),
      },
    });

    return NextResponse.json({
      message: "Time tracking started",
      startTime: startTime.toISOString(),
    });
  } catch (error) {
    console.error("Error starting time tracking:", error);
    return NextResponse.json(
      { error: "Failed to start time tracking" },
      { status: 500 }
    );
  }
}
