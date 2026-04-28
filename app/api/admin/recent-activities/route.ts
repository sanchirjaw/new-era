import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-server"
import { db } from "@/lib/database"

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

    // Get recent activities from different collections
    const recentActivities = await db.getRecentActivities()
    
    return NextResponse.json({ activities: recentActivities })
  } catch (error) {
    console.error("Error fetching recent activities:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
