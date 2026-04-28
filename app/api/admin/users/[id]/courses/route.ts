import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-server"
import { db } from "@/lib/database"
import { ObjectId } from "mongodb"
import { auth } from "@/auth"

function parseObjectId(id: string) {
  if (!ObjectId.isValid(id)) return null
  return new ObjectId(id)
}

// GET /api/admin/users/[id]/courses - Get user's enrolled courses
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    let adminUser: { id: string; role: string } | null = null

    if (session?.user?.email) {
      const dbUser = await db.getUserByEmail(session.user.email)
      if (dbUser?._id && dbUser.role === "admin") {
        adminUser = { id: dbUser._id.toString(), role: dbUser.role }
      }
    }

    if (!adminUser) {
      const token = request.cookies.get("admin-token")?.value
      if (token) adminUser = verifyToken(token)
    }

    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const userId = parseObjectId(id)
    if (!userId) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 })
    }

    const existingUser = await db.getUserById(userId)
    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      userId: id,
      enrolledCourses: (existingUser.enrolledCourses || []).map((courseId: any) => courseId.toString()),
    })
  } catch (error) {
    console.error("Failed to get user courses:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/admin/users/[id]/courses - Update user course access
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check NextAuth admin session first, then fall back to admin-token.
    const session = await auth()
    let adminUser: { id: string; role: string } | null = null

    if (session?.user?.email) {
      const dbUser = await db.getUserByEmail(session.user.email)
      if (dbUser?._id && dbUser.role === "admin") {
        adminUser = { id: dbUser._id.toString(), role: dbUser.role }
      }
    }

    if (!adminUser) {
      const token = request.cookies.get("admin-token")?.value
      if (token) adminUser = verifyToken(token)
    }

    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const userId = parseObjectId(id)
    if (!userId) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 })
    }

    const { courseIds } = await request.json()

    // Validate input
    if (!Array.isArray(courseIds)) {
      return NextResponse.json({ error: "courseIds must be an array" }, { status: 400 })
    }

    // Validate that all course IDs are valid ObjectIds
    const validCourseIds = courseIds.filter((courseId: string) => ObjectId.isValid(courseId))
    if (validCourseIds.length !== courseIds.length) {
      return NextResponse.json({ error: "Invalid course ID format" }, { status: 400 })
    }

    const normalizedCourseIds = validCourseIds.map((courseId: string) => new ObjectId(courseId))

    // Check if user exists
    const existingUser = await db.getUserById(userId)
    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update user's enrolled courses
    const success = await db.updateUser(userId, {
      enrolledCourses: normalizedCourseIds as any
    })
    
    if (!success) {
      return NextResponse.json({ error: "Failed to update user course access" }, { status: 500 })
    }

    return NextResponse.json({ 
      message: "User course access updated successfully",
      enrolledCourses: normalizedCourseIds.map((courseId) => courseId.toString())
    })
  } catch (error) {
    console.error("Failed to update user course access:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
