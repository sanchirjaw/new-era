import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-server"
import { db } from "@/lib/database"
import { ObjectId } from "mongodb"

// GET /api/auth/enrollments - Get user enrollments
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user enrollments
    const enrollments = await db.getUserEnrollments(new ObjectId(user.id))

    return NextResponse.json({
      enrollments: enrollments || []
    })
  } catch (error) {
    console.error("Failed to get user enrollments:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
