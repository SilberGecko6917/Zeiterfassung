import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkIsAdmin } from "@/lib/server/auth-actions";
import { LogAction, LogEntity } from "@/lib/enums";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await checkIsAdmin();
    const session = await getServerSession(authOptions);
    
    if (!isAdmin || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    
    const { id } = await params;
    const vacationId = parseInt(id);
    const { status } = await request.json();
    
    // Validate status
    if (!["approved", "rejected", "pending"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }
    
    // Find existing vacation
    const existingVacation = await prisma.vacation.findUnique({
      where: { id: vacationId },
    });
    
    if (!existingVacation) {
      return NextResponse.json(
        { error: "Vacation not found" },
        { status: 404 }
      );
    }
    
    // Update vacation status
    const updatedVacation = await prisma.vacation.update({
      where: { id: vacationId },
      data: { status },
    });
    
    // If approved, increment vacation days taken
    if (status === "approved" && existingVacation.status !== "approved") {
      await prisma.user.update({
        where: { id: existingVacation.userId },
        data: {
          vacationDaysTaken: {
            increment: existingVacation.days
          }
        }
      });
    }
    
    // If rejected, decrement vacation days taken
    if (status === "rejected" && existingVacation.status === "approved") {
      await prisma.user.update({
        where: { id: existingVacation.userId },
        data: {
          vacationDaysTaken: {
            decrement: existingVacation.days
          }
        }
      });
    }

    await prisma.log.create({
      data: {
        userId: session.user.id,
        action: LogAction.UPDATE,
        entity: LogEntity.VACATION,
        entityId: vacationId.toString(),
        details: JSON.stringify({
          oldStatus: existingVacation.status,
          newStatus: status,
        }),
        ipAddress: request.headers.get("x-forwarded-for") || undefined,
      },
    });
    
    return NextResponse.json({ vacation: updatedVacation });
  } catch (error) {
    console.error("Error updating vacation status:", error);
    return NextResponse.json(
      { error: "Failed to update vacation status" },
      { status: 500 }
    );
  }
}