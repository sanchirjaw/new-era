import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-server"
import { db } from "@/lib/database"

// GET /api/admin/database - Get database statistics and collection info
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

    // Get database statistics and collections
    const { stats, collections } = await db.getDatabaseStats()
    
    return NextResponse.json({ stats, collections })
  } catch (error) {
    console.error("Failed to fetch database stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
