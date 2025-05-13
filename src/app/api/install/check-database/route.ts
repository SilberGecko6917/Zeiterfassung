import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  isInstalled,
  getInstallationState,
  setInstallationComplete,
} from "@/lib/installationState";
import { LogAction, LogEntity } from "@/lib/enums";
import { IP } from "@/lib/server/auth-actions";

export async function GET() {
  try {
    if (await isInstalled()) {
      return NextResponse.json(
        { error: "Installation already completed" },
        { status: 403 }
      );
    }

    await prisma.$queryRaw`SELECT 1`;

    const adminExists = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });

    if (adminExists && !(await isInstalled())) {
      setInstallationComplete(adminExists.email);
    }

    await prisma.log.create({
      data: {
        userId: undefined,
        action: LogAction.INSTALLATION_DATABASE_CHECK,
        entity: LogEntity.INSTALLATION,
        details: JSON.stringify({
          message: "Database connection check",
          connected: true,
          adminExists: !!adminExists,
          installationComplete: await isInstalled(),
          installationState: await getInstallationState(),
        }),
        ipAddress: await IP(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      isSetup: !!adminExists,
      installationComplete: await isInstalled(),
    });
  } catch (error) {
    console.error("Database connection error:", error);
    return NextResponse.json(
      {
        connected: false,
        error: "Database connection failed",
        installationComplete: isInstalled(),
      },
      { status: 500 }
    );
  }
}
