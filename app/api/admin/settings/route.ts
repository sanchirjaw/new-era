import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-server"
import { db } from "@/lib/database"

// GET /api/admin/settings - Get platform settings
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const token = request.cookies.get("admin-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get platform settings
    const settings = await db.getPlatformSettings()
    
    return NextResponse.json({ settings })
  } catch (error) {
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/admin/settings - Update platform settings
export async function PUT(request: NextRequest) {
  try {
    // Verify admin authentication
    const token = request.cookies.get("admin-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const settings = body.settings

    if (!settings) {
      return NextResponse.json({ error: "Settings data is required" }, { status: 400 })
    }

    const success = await db.updatePlatformSettings(settings)

    if (success) {
      return NextResponse.json({ success: true, message: "Settings updated successfully" })
    } else {
      return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
    }
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
