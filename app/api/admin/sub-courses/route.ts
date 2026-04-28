import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-server"
import { db } from "@/lib/database"

// GET /api/admin/sub-courses - Get all sub-courses
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

    // Get all sub-courses
    const subCourses = await db.getAllSubCourses()
    
    return NextResponse.json({ subCourses })
  } catch (error) {
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/admin/sub-courses - Create new sub-course
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

    const { title, description, courseId, order, isActive } = await request.json()

    console.log("Creating subcourse with data:", { title, description, courseId, order, isActive })

    // Validate input
    if (!title || !description || !courseId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create sub-course
    const subCourseId = await db.createSubCourse({
      title,
      description,
      courseId,
      order: order || 1,
      lessons: [],
      isActive: isActive !== false
    })

    console.log("Subcourse created with ID:", subCourseId)

    return NextResponse.json({ 
      message: "Sub-course created successfully",
      subCourseId 
    }, { status: 201 })
  } catch (error) {
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
