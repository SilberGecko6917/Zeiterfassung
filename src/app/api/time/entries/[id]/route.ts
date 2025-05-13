import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { IP } from "@/lib/server/auth-actions";
import { LogAction, LogEntity } from "@/lib/enums";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const entryId = parseInt((await params).id);
    if (isNaN(entryId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    // Find the time entry
    const timeEntry = await prisma.trackedTime.findUnique({
      where: { id: entryId },
    });

    if (!timeEntry) {
      return NextResponse.json(
        { error: "Time entry not found" },
        { status: 404 }
      );
    }

    // Check if the entry belongs to the current user
    if (timeEntry.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only delete your own time entries" },
        { status: 403 }
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
          message: "Time entry deleted by user",
          entryId,
          startTime: timeEntry.startTime,
          endTime: timeEntry.endTime,
          duration: Number(timeEntry.duration),
        }),
        ipAddress: await IP(),
      },
    });

    return NextResponse.json({ message: "Time entry deleted successfully" });
  } catch (error) {
    console.error("Error deleting time entry:", error);
    return NextResponse.json(
      { error: "Failed to delete time entry" },
      { status: 500 }
    );
  }
}
