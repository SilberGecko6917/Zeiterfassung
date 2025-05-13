import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkIsAdmin, IP } from "@/lib/server/auth-actions";
import { LogAction, LogEntity } from "@/lib/enums";

export async function GET() {
  try {
    const isAdmin = await checkIsAdmin();

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      include: {
        breakSettings: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching break settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch break settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const isAdmin = await checkIsAdmin();

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { userId, breakDuration, autoInsert } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Upsert break settings
    const breakSettings = await prisma.userBreakSettings.upsert({
      where: { userId },
      create: {
        userId,
        breakDuration: breakDuration || 30,
        autoInsert: autoInsert !== undefined ? autoInsert : true,
      },
      update: {
        breakDuration: breakDuration !== undefined ? breakDuration : undefined,
        autoInsert: autoInsert !== undefined ? autoInsert : undefined,
      },
    });

    // Log this action
    await prisma.log.create({
      data: {
        userId: userId,
        action: LogAction.UPDATE,
        entity: LogEntity.BREAK_SETTINGS,
        entityId: String(breakSettings.id),
        details: JSON.stringify({
          breakDuration,
          autoInsert,
        }),
        ipAddress: await IP(),
      },
    });

    return NextResponse.json({ breakSettings });
  } catch (error) {
    console.error("Error updating break settings:", error);
    return NextResponse.json(
      { error: "Failed to update break settings" },
      { status: 500 }
    );
  }
}
