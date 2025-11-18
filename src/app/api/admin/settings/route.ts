import { NextRequest, NextResponse } from "next/server";
import { saveSetting, getAllSettings, settingsDefinitions } from "@/lib/settings";
import { checkIsAdmin } from "@/lib/server/auth-actions";

// GET /api/admin/settings
export async function GET() {
  try {
    const isAdmin = await checkIsAdmin();
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const settings = await getAllSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Failed to get settings:", error);
    return NextResponse.json(
      { error: "Failed to get settings" },
      { status: 500 }
    );
  }
}

// POST /api/admin/settings
export async function POST(request: NextRequest) {
  try {
    const isAdmin = await checkIsAdmin();
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const { key, value } = await request.json();
    
    // Validate the key
    const definition = settingsDefinitions.find((def) => def.key === key);
    if (!definition) {
      return NextResponse.json(
        { error: `Setting with key '${key}' not found` },
        { status: 400 }
      );
    }
    
    await saveSetting(key, value);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save setting:", error);
    return NextResponse.json(
      { error: "Failed to save setting" },
      { status: 500 }
    );
  }
}