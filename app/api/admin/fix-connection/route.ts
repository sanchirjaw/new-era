import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-server"
import { db } from "@/lib/database"
import { ObjectId } from "mongodb"

// POST /api/admin/fix-connection - Fix connection between existing subcourse and course
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

    const { subCourseId, courseId } = await request.json()

    if (!subCourseId || !courseId) {
      return NextResponse.json({ error: "Missing subCourseId or courseId" }, { status: 400 })
    }

    console.log("Fixing connection: subcourse", subCourseId, "to course", courseId)

    // Convert IDs to ObjectId
    const subCourseObjectId = new ObjectId(subCourseId)
    const courseObjectId = new ObjectId(courseId)

    // Update the subcourse to link it to the course
    const result = await db.updateSubCourse(subCourseObjectId, {
      courseId: courseObjectId
    })

    if (result) {
      console.log("Successfully connected subcourse to course")
      return NextResponse.json({ 
        message: "Connection fixed successfully",
        subCourseId,
        courseId
      })
    } else {
      return NextResponse.json({ error: "Failed to fix connection" }, { status: 500 })
    }

  } catch (error) {
    console.error("Error fixing connection:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
