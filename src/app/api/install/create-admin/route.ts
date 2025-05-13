import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { setInstallationComplete, isInstalled } from "@/lib/installationState";
import { LogAction, LogEntity } from "@/lib/enums";
import { IP } from "@/lib/server/auth-actions";

export async function POST(request: NextRequest) {
  try {
    if (await isInstalled()) {
      if (await isInstalled()) {
        return NextResponse.json(
          { error: "Installation already completed" },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Name, email and password are required" },
        { status: 400 }
      );
    }

    const adminExists = await prisma.user.findFirst({
      where: {
        role: "ADMIN",
      },
    });

    if (adminExists) {
      setInstallationComplete(adminExists.email);
      return NextResponse.json(
        { message: "An admin account already exists" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "A user with this email already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "ADMIN",
      },
    });

    setInstallationComplete(email);

    const { password: _, ...userWithoutPassword } = user;

    await prisma.log.create({
      data: {
        userId: user ? user.id : undefined,
        action: LogAction.INSTALLATION_CREATED_ADMIN,
        entity: LogEntity.INSTALLATION,
        details: JSON.stringify({
          message: "Admin account created",
          userId: user.id,
          email: user.email,
          role: user.role,
          installationComplete: await isInstalled(),
        }),
        ipAddress: await IP(),
      },
    });

    return NextResponse.json({
      message: "Admin account created successfully",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Error creating admin user:", error);
    return NextResponse.json(
      { message: "Failed to create admin account" },
      { status: 500 }
    );
  }
}
