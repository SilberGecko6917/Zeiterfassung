import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { checkIsAdmin, IP } from "@/lib/server/auth-actions";
import { LogAction, LogEntity } from "@/lib/enums";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const ROLE_HIERARCHY: Record<string, number> = {
  ADMIN: 3,
  MANAGER: 2,
  USER: 1,
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await checkIsAdmin();
    const session = await getServerSession(authOptions);

    if (!isAdmin || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const userId = (await params).id;
    const body = await request.json();
    const { name, email, password, role } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        id: { not: userId },
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already in use by another user" },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      name,
      email,
      role: role || "USER",
    };

    if (password && password.trim() !== "") {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    await prisma.log.create({
      data: {
        userId: session.user.id,
        action: LogAction.USER_UPDATE,
        entity: LogEntity.USER,
        details: JSON.stringify({
          message: "Updated user",
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        }),
        ipAddress: await IP(),
      },
    });

    return NextResponse.json({
      message: "User updated successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await checkIsAdmin();
    const session = await getServerSession(authOptions);

    if (!isAdmin || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const userId = (await params).id;

    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const totalUsers = await prisma.user.count();
    if (totalUsers <= 1) {
      return NextResponse.json(
        { error: "Cannot delete the last account in the system" },
        { status: 403 }
      );
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const currentUserLevel = ROLE_HIERARCHY[currentUser.role] || 0;
    const targetUserLevel = ROLE_HIERARCHY[user.role] || 0;

    if (targetUserLevel >= currentUserLevel) {
      return NextResponse.json(
        { error: "Cannot delete users with equal or higher role" },
        { status: 403 }
      );
    }

    await prisma.trackedTime.deleteMany({
      where: { userId },
    });

    await prisma.user.delete({
      where: { id: userId },
    });

    await prisma.log.create({
      data: {
        userId: session.user.id,
        action: LogAction.USER_DELETE,
        entity: LogEntity.USER,
        details: JSON.stringify({
          message: "Deleted user",
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        }),
        ipAddress: await IP(),
      },
    });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
