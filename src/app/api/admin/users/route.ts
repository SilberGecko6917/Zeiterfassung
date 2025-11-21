import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { checkIsAdmin, IP } from "@/lib/server/auth-actions";
import { authOptions } from "@/lib/auth";
import { LogAction, LogEntity } from "@/lib/enums";
import { getServerSession } from "next-auth";

// Get all users
export async function GET() {
  try {
    const isAdmin = await checkIsAdmin();

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// Create a new user
export async function POST(request: NextRequest) {
  try {
    const isAdmin = await checkIsAdmin();
    const session = await getServerSession(authOptions);

    if (!isAdmin || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, password, role, showWeeklySummary, weeklyTargetHours } = body;

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email and password are required" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with weekly summary settings
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || "USER",
        showWeeklySummary: typeof showWeeklySummary === "boolean" ? showWeeklySummary : true,
        weeklyTargetHours: typeof weeklyTargetHours === "number" && weeklyTargetHours >= 0 ? weeklyTargetHours : 40.0,
      },
    });

    await prisma.log.create({
      data: {
        userId: session.user.id,
        action: LogAction.USER_CREATE,
        entity: LogEntity.USER,
        details: JSON.stringify({
          message: "New user Created",
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

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
