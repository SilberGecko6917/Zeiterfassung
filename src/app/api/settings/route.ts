import { NextResponse } from "next/server";
import { getSetting } from "@/lib/settings";

// Whitelist of settings that are safe to expose publicly
const PUBLIC_SETTINGS = [
  "company_name",
  "time_format",
  "date_format",
  "default_language",
  "disable_landing_page",
  "auto_redirect_from_login",
  "contact_email",
  "contact_phone",
  "impressum",
  "datenschutz",
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json(
        { error: "Setting key is required" },
        { status: 400 }
      );
    }

    // Check if the setting is in the public whitelist
    if (!PUBLIC_SETTINGS.includes(key)) {
      return NextResponse.json(
        { error: "Setting not available" },
        { status: 403 }
      );
    }

    const value = await getSetting(key);

    return NextResponse.json({ value });
  } catch (error) {
    console.error("Error fetching setting:", error);
    return NextResponse.json(
      { error: "Failed to fetch setting" },
      { status: 500 }
    );
  }
}
