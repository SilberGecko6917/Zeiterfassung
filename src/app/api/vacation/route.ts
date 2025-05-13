import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LogAction, LogEntity } from "@/lib/enums";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { startDate, endDate, description } = await request.json();
    
    // Validating input
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Start- und Enddatum sind erforderlich" },
        { status: 400 }
      );
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Calculate the number of days between start & end (Mo-Fr) 
    const days = calculateWorkDays(start, end);
    
    const vacation = await prisma.vacation.create({
      data: {
        userId: session.user.id,
        startDate: start,
        endDate: end,
        days,
        description,
      },
    });

    await prisma.log.create({
      data: {
        userId: session.user.id,
        action: LogAction.CREATE,
        entity: LogEntity.VACATION,
        entityId: vacation.id.toString(),
        details: JSON.stringify(vacation),
        ipAddress: request.headers.get("x-forwarded-for") || undefined,
      },
    });
    
    return NextResponse.json({ vacation });
  } catch (error) {
    console.error("Error creating vacation request:", error);
    return NextResponse.json(
      { error: "Failed to create vacation request" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const vacations = await prisma.vacation.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        startDate: 'desc',
      },
    });
    
    // Calculate number of vacation days left
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { vacationDaysPerYear: true, vacationDaysTaken: true },
    });
    
    const remainingDays = user ? user.vacationDaysPerYear - user.vacationDaysTaken : 0;
    
    return NextResponse.json({ 
      vacations, 
      totalDays: user?.vacationDaysPerYear || 30,
      takenDays: user?.vacationDaysTaken || 0,
      remainingDays 
    });
  } catch (error) {
    console.error("Error fetching vacations:", error);
    return NextResponse.json(
      { error: "Failed to fetch vacations" },
      { status: 500 }
    );
  }
}

function calculateWorkDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    // 0 = Sunday, 6 = Saturday
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return count;
}