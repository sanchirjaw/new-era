import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-server"
import { db } from "@/lib/database"
import { ObjectId } from "mongodb"

// POST /api/auth/progress/mark-complete - Mark lesson as complete
export async function POST(request: NextRequest) {
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

    const { courseId, lessonId } = await request.json()

    if (!courseId || !lessonId) {
      return NextResponse.json({ 
        error: "Missing required fields",
        details: { courseId: !!courseId, lessonId: !!lessonId }
      }, { status: 400 })
    }

    // Mark lesson as complete
    const success = await db.markLessonComplete(
      new ObjectId(user.id),
      new ObjectId(courseId),
      new ObjectId(lessonId)
    )

    if (!success) {
      return NextResponse.json({ error: "Failed to mark lesson complete" }, { status: 500 })
    }

    // Get updated progress
    const progress = await db.getUserProgress(
      new ObjectId(user.id),
      new ObjectId(courseId)
    )

    return NextResponse.json({ 
      success: true,
      message: "Lesson marked as complete",
      progress
    })
  } catch (error) {
    console.error("Failed to mark lesson complete:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
