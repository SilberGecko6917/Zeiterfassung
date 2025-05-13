import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { checkIsAdmin, IP } from "@/lib/server/auth-actions";
import { LogAction, LogEntity } from "@/lib/enums";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Update a user
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
    const userId = (await params).id;
    const body = await request.json();
    const { name, email, password, role } = body;

    // Validate input
    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Check if email is already in use by another user
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

    // Prepare update data
    const updateData: any = {
      name,
      email,
      role: role || "user",
    };

    // Only update password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Update user
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

// Delete a user
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

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete user's time entries first (to avoid foreign key constraint errors)
    await prisma.trackedTime.deleteMany({
      where: { userId },
    });

    // Delete user's sessions
    await prisma.session.deleteMany({
      where: { userId },
    });

    // Delete user
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
