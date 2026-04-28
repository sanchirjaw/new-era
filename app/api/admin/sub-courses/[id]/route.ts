import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-server"
import { db } from "@/lib/database"
import { ObjectId } from "mongodb"

// GET /api/admin/sub-courses/[id] - Get sub-course by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const subCourseId = new ObjectId(params.id)
    const subCourse = await db.getSubCourseById(subCourseId)
    
    if (!subCourse) {
      return NextResponse.json({ error: "Sub-course not found" }, { status: 404 })
    }

    return NextResponse.json({ subCourse })
  } catch (error) {
    console.error("Failed to get sub-course:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/admin/sub-courses/[id] - Update sub-course
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

    const subCourseId = new ObjectId(params.id)
    const updates = await request.json()

    // Check if sub-course exists
    const existingSubCourse = await db.getSubCourseById(subCourseId)
    if (!existingSubCourse) {
      return NextResponse.json({ error: "Sub-course not found" }, { status: 404 })
    }

    // Update sub-course
    const success = await db.updateSubCourse(subCourseId, updates)
    
    if (!success) {
      return NextResponse.json({ error: "Failed to update sub-course" }, { status: 500 })
    }

    return NextResponse.json({ message: "Sub-course updated successfully" })
  } catch (error) {
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/admin/sub-courses/[id] - Delete sub-course
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

    const subCourseId = new ObjectId(params.id)

    // Check if sub-course exists
    const existingSubCourse = await db.getSubCourseById(subCourseId)
    if (!existingSubCourse) {
      return NextResponse.json({ error: "Sub-course not found" }, { status: 404 })
    }

    // Delete sub-course
    const success = await db.deleteSubCourse(subCourseId)
    
    if (!success) {
      return NextResponse.json({ error: "Failed to delete sub-course" }, { status: 500 })
    }

    return NextResponse.json({ message: "Sub-course deleted successfully" })
  } catch (error) {
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
