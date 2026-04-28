import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-server"
import { db } from "@/lib/database"
import { ObjectId } from "mongodb"

// GET /api/debug/user - Debug user data
export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Debug user endpoint called")
    
    // Verify authentication
    const token = request.cookies.get("auth-token")?.value
    console.log("🍪 Auth token present:", !!token)
    
    if (!token) {
      return NextResponse.json({ error: "No auth token" }, { status: 401 })
    }

    const user = verifyToken(token)
    console.log("👤 User verified:", !!user, user?.id)
    
    if (!user) {
      return NextResponse.json({ error: "User verification failed" }, { status: 403 })
    }

    // Get user data
    const userData = await db.getUserById(new ObjectId(user.id))
    console.log("📖 User data:", userData ? "Found" : "Not found")
    
    if (userData) {
      console.log("📊 User enrolled courses:", userData.enrolledCourses?.length || 0)
      console.log("📋 Enrolled course IDs:", userData.enrolledCourses?.map(id => id.toString()) || [])
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        hasUserData: !!userData,
        enrolledCoursesCount: userData?.enrolledCourses?.length || 0,
        enrolledCourseIds: userData?.enrolledCourses?.map(id => id.toString()) || []
      }
    })
  } catch (error) {
    console.error("Debug user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
