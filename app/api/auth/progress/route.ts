import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-server"
import { db } from "@/lib/database"
import { ObjectId } from "mongodb"

// GET /api/auth/progress?courseId=... - Get user progress for a course
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')

    if (!courseId) {
      return NextResponse.json({ 
        error: "Missing courseId parameter"
      }, { status: 400 })
    }

    // Get user progress for this course
    const progress = await db.getUserProgress(
      new ObjectId(user.id),
      new ObjectId(courseId)
    )

    if (!progress) {
      return NextResponse.json({ 
        completedLessons: [],
        totalLessons: 0,
        progressPercentage: 0
      })
    }

    return NextResponse.json({ 
      completedLessons: progress.completedLessons || [],
      totalLessons: progress.totalLessons || 0,
      progressPercentage: progress.progressPercentage || 0
    })

  } catch (error) {
    console.error("Failed to get user progress:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
