import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-server"
import { db } from "@/lib/database"

// GET /api/admin/courses - Get all courses
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

    // Get all courses
    const courses = await db.getAllCourses()

    return NextResponse.json({ courses })
  } catch (error) {
    console.error("Failed to fetch courses:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/admin/courses - Create new course
export async function POST(request: NextRequest) {
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

    const { title, description, price, originalPrice, category, level, isActive, thumbnailUrl } = await request.json()

    // Validate input
    if (!title || !description || !category || !level) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!["beginner", "intermediate", "advanced"].includes(level)) {
      return NextResponse.json({ error: "Invalid level" }, { status: 400 })
    }

    // Create course
    const courseId = await db.createCourse({
      title,
      description,
      price: price || 0,
      originalPrice: originalPrice || 0,
      category,
      level,
      duration: 0, // Will be calculated from lessons
      lessons: [],
      enrolledCount: 0,
      rating: 0,
      totalRatings: 0,
      isActive: isActive !== false,
      thumbnailUrl: thumbnailUrl || null
    })

    return NextResponse.json({
      message: "Course created successfully",
      courseId
    }, { status: 201 })
  } catch (error) {
    console.error("Failed to create course:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
