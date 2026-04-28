import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-server"
import { db } from "@/lib/database"

// POST /api/admin/fix-lesson-orders - Fix lesson orders for existing lessons
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

    console.log("Fixing lesson orders...")

    // Get all subcourses
    const subCourses = await db.getAllSubCourses()
    let totalFixed = 0

    for (const subCourse of subCourses) {
      // Get lessons for this subcourse
      const lessons = await db.getLessonsBySubCourseId(subCourse._id)
      
      if (lessons.length > 0) {
        // Sort lessons by creation date to maintain chronological order
        const sortedLessons = lessons.sort((a, b) => 
          new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
        )
        
        // Update each lesson with sequential order
        for (let i = 0; i < sortedLessons.length; i++) {
          const lesson = sortedLessons[i]
          if (lesson.order !== i + 1) {
            await db.updateLesson(lesson._id, { order: i + 1 })
            totalFixed++
            console.log(`Fixed lesson ${lesson.title}: order ${lesson.order} → ${i + 1}`)
          }
        }
      }
    }

    console.log(`Fixed ${totalFixed} lesson orders`)
    return NextResponse.json({ 
      message: `Fixed ${totalFixed} lesson orders successfully`,
      totalFixed
    })

  } catch (error) {
    console.error("Error fixing lesson orders:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
