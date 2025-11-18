import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkIsAdmin, checkPermission } from "@/lib/server/auth-actions";

export async function GET(request: NextRequest) {
  try {
    // Check if user has permission - admin or manager with manage_all_vacation permission
    const isAdmin = await checkIsAdmin();
    const hasVacationPermission = await checkPermission("manage_all_vacation");
    
    if (!isAdmin && !hasVacationPermission) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const userId = url.searchParams.get("userId");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {};
    if (status) {
      filter.status = status;
    }
    if (userId) {
      filter.userId = userId;
    }
    
    const vacations = await prisma.vacation.findMany({
      where: filter,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            vacationDaysPerYear: true,
            vacationDaysTaken: true,
          }
        }
      },
      orderBy: {
        startDate: 'desc',
      },
    });
    
    return NextResponse.json({ vacations });
  } catch (error) {
    console.error("Error fetching vacations:", error);
    return NextResponse.json(
      { error: "Failed to fetch vacations" },
      { status: 500 }
    );
  }
}