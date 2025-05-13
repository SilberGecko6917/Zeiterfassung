import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

interface InstallationState {
  installed: boolean;
  installedAt?: string;
  adminEmail?: string;
}

const SETTINGS_KEY = "installation_status";

export async function getInstallationState(): Promise<InstallationState> {
  try {
    const installCookie = (await cookies()).get("installation-complete");
    if (installCookie?.value === "true") {
      return { installed: true };
    }

    const installationSetting = await prisma.setting.findUnique({
      where: { key: SETTINGS_KEY },
    });

    if (installationSetting) {
      const state = JSON.parse(installationSetting.value);
      return state;
    }

    return { installed: false };
  } catch (error) {
    console.error("Error reading installation state:", error);
    return { installed: false };
  }
}

export async function setInstallationComplete(
  adminEmail: string
): Promise<void> {
  try {
    const state: InstallationState = {
      installed: true,
      installedAt: new Date().toISOString(),
      adminEmail,
    };

    await prisma.setting.upsert({
      where: { key: SETTINGS_KEY },
      update: { value: JSON.stringify(state) },
      create: { key: SETTINGS_KEY, value: JSON.stringify(state) },
    });

    (await cookies()).set("installation-complete", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
  } catch (error) {
    console.error("Error writing installation state:", error);
  }
}

export async function isInstalled(): Promise<boolean> {
  const state = await getInstallationState();
  return state.installed;
}
