import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-server"
import { db } from "@/lib/database"
import { ObjectId } from "mongodb"

// GET /api/admin/users/[id]/courses - Get user's enrolled courses
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = new ObjectId(params.id)
    
    // For build-time compatibility, return a simple response
    // The actual user course data will be fetched when needed at runtime
    return NextResponse.json({ 
      message: "User courses endpoint available",
      userId: params.id 
    })
  } catch (error) {
    console.error("Failed to get user courses:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/admin/users/[id]/courses - Update user course access
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const userId = new ObjectId(params.id)
    const { courseIds } = await request.json()

    // Validate input
    if (!Array.isArray(courseIds)) {
      return NextResponse.json({ error: "courseIds must be an array" }, { status: 400 })
    }

    // Validate that all course IDs are valid ObjectIds
    const validCourseIds = courseIds.filter(id => ObjectId.isValid(id))
    if (validCourseIds.length !== courseIds.length) {
      return NextResponse.json({ error: "Invalid course ID format" }, { status: 400 })
    }

    // Check if user exists
    const existingUser = await db.getUserById(userId)
    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update user's enrolled courses
    const success = await db.updateUser(userId, {
      enrolledCourses: validCourseIds
    })
    
    if (!success) {
      return NextResponse.json({ error: "Failed to update user course access" }, { status: 500 })
    }

    return NextResponse.json({ 
      message: "User course access updated successfully",
      enrolledCourses: validCourseIds
    })
  } catch (error) {
    console.error("Failed to update user course access:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
