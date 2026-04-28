import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-server"
import { db } from "@/lib/database"
import { ObjectId } from "mongodb"

// GET /api/debug/enrolled-courses - Debug user's enrolled courses
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    console.log("🔍 Debug: User ID:", user.id)
    console.log("🔍 Debug: User role:", user.role)

    // Get user with enrolled courses
    const userData = await db.getUserById(new ObjectId(user.id))
    console.log("🔍 Debug: User data found:", !!userData)
    console.log("🔍 Debug: User enrolledCourses:", userData?.enrolledCourses)
    console.log("🔍 Debug: User enrolledCourses length:", userData?.enrolledCourses?.length || 0)

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if user has enrolled courses
    if (!userData.enrolledCourses || userData.enrolledCourses.length === 0) {
      return NextResponse.json({
        message: "User has no enrolled courses",
        user: {
          id: userData._id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          enrolledCourses: userData.enrolledCourses || []
        }
      })
    }

    // Try to fetch one course to see if there are any issues
    const firstCourseId = userData.enrolledCourses[0]
    console.log("🔍 Debug: First course ID:", firstCourseId)
    
    const firstCourse = await db.getCourseById(firstCourseId)
    console.log("🔍 Debug: First course found:", !!firstCourse)
    console.log("🔍 Debug: First course data:", firstCourse)

    return NextResponse.json({
      message: "User has enrolled courses",
      user: {
        id: userData._id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        enrolledCoursesCount: userData.enrolledCourses.length,
        enrolledCourses: userData.enrolledCourses.map(id => id.toString())
      },
      firstCourse: firstCourse ? {
        id: firstCourse._id,
        title: firstCourse.title,
        isActive: firstCourse.isActive
      } : null
    })
  } catch (error) {
    console.error("Debug enrolled courses error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
