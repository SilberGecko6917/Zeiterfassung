import { NextResponse } from "next/server";
import { APP_VERSION, getLatestGitHubRelease } from "@/lib/version";

export async function GET() {
  try {
    const latestRelease = await getLatestGitHubRelease();

    return NextResponse.json({
      current: APP_VERSION,
      latest: latestRelease?.tag_name || null,
      latestRelease: latestRelease || null,
    });
  } catch (error) {
    console.error("Version check failed:", error);
    return NextResponse.json(
      { error: "Failed to check version" },
      { status: 500 }
    );
  }
}
