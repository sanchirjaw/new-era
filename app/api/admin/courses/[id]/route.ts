import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-server"
import { db } from "@/lib/database"
import { ObjectId } from "mongodb"

// GET /api/admin/courses/[id] - Get course by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const courseId = new ObjectId(params.id)
    const course = await db.getCourseById(courseId)
    
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    return NextResponse.json({ course })
  } catch (error) {
    console.error("Failed to get course:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/admin/courses/[id] - Update course
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

    const courseId = new ObjectId(params.id)
    const updates = await request.json()

    // Check if course exists
    const existingCourse = await db.getCourseById(courseId)
    if (!existingCourse) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    // Update course
    const success = await db.updateCourse(courseId, updates)
    
    if (!success) {
      return NextResponse.json({ error: "Failed to update course" }, { status: 500 })
    }

    return NextResponse.json({ message: "Course updated successfully" })
  } catch (error) {
    console.error("Failed to update course:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/admin/courses/[id] - Delete course
export async function DELETE(
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

    const courseId = new ObjectId(params.id)

    // Check if course exists
    const existingCourse = await db.getCourseById(courseId)
    if (!existingCourse) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    // Delete course
    const success = await db.deleteCourse(courseId)
    
    if (!success) {
      return NextResponse.json({ error: "Failed to delete course" }, { status: 500 })
    }

    return NextResponse.json({ message: "Course deleted successfully" })
  } catch (error) {
    console.error("Failed to delete course:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
