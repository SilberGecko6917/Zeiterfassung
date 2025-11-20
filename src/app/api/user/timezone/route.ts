import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidTimezone } from "@/lib/timezone";
import { LogAction, LogEntity } from "@/lib/enums";
import { IP } from "@/lib/server/auth-actions";

/**
 * GET /api/user/timezone
 * Get the current user's timezone preference
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { timezone: true }
    });

    return NextResponse.json({ 
      timezone: user?.timezone || "UTC" 
    });
  } catch (error) {
    console.error("Error fetching user timezone:", error);
    return NextResponse.json(
      { error: "Failed to fetch timezone" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/timezone
 * Update the current user's timezone preference
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { timezone } = body;

    if (!timezone) {
      return NextResponse.json(
        { error: "Timezone is required" },
        { status: 400 }
      );
    }

    if (!isValidTimezone(timezone)) {
      return NextResponse.json(
        { error: "Invalid timezone" },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { timezone }
    });

    await prisma.log.create({
      data: {
        userId: session.user.id,
        action: LogAction.UPDATE,
        entity: LogEntity.USER,
        details: JSON.stringify({
          message: "Timezone preference updated",
          timezone
        }),
        ipAddress: await IP(),
      },
    });

    return NextResponse.json({ 
      success: true, 
      timezone 
    });
  } catch (error) {
    console.error("Error updating user timezone:", error);
    return NextResponse.json(
      { error: "Failed to update timezone" },
      { status: 500 }
    );
  }
}
