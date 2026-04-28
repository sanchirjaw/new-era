import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"

// GET /api/sub-courses - Get sub-courses by courseId (public endpoint)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    
    if (!courseId) {
      return NextResponse.json({ error: "Course ID is required" }, { status: 400 })
    }

    // Get sub-courses for the specified course
    const subCourses = await db.getSubCoursesByCourseId(courseId)
    
    return NextResponse.json({ subCourses })
  } catch (error) {
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
