import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find current active session
    const currentSession = await prisma.trackedTime.findFirst({
      where: {
        userId: session.user.id,
        endTime: null,
      },
    });

    const serializedSession = currentSession
      ? JSON.parse(
          JSON.stringify(currentSession, (key, value) =>
            typeof value === "bigint" ? value.toString() : value
          )
        )
      : null;

    return NextResponse.json({ currentSession: serializedSession });
  } catch (error) {
    console.error("Error checking current session:", error);
    return NextResponse.json(
      { error: "Failed to check current session" },
      { status: 500 }
    );
  }
}
