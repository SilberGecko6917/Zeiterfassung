import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkIsAdmin } from "@/lib/server/auth-actions";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const isAdmin = await checkIsAdmin();

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { userId } = await params;

    const breakSettings = await prisma.userBreakSettings.findUnique({
      where: { userId },
    });

    if (!breakSettings) {
      return NextResponse.json({
        breakSettings: {
          userId,
          breakDuration: 30,
          autoInsert: true,
        },
      });
    }

    return NextResponse.json({ breakSettings });
  } catch (error) {
    console.error("Error fetching break settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch break settings" },
      { status: 500 }
    );
  }
}
