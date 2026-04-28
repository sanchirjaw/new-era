import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { verifyToken } from "@/lib/auth-server"
import { db } from "@/lib/database"
import { ObjectId } from "mongodb"

// GET /api/auth/my-stats - Get user-specific stats
export async function GET(request: NextRequest) {
  try {
    let userId: string | null = null

    // First try NextAuth.js session
    try {
      const session = await auth()
      if (session?.user?.id) {
        userId = session.user.id
      }
    } catch (error) {
      console.log("NextAuth session check failed, trying custom auth")
    }

    // If NextAuth failed, try custom auth token
    if (!userId) {
      const token = request.cookies.get("auth-token")?.value
      if (token) {
        const user = verifyToken(token)
        if (user) {
          userId = user.id
        }
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user with enrolled courses
    const userData = await db.getUserById(new ObjectId(userId))

    if (!userData || !userData.enrolledCourses || userData.enrolledCourses.length === 0) {
      return NextResponse.json({
        stats: {
          enrolledCourses: 0,
          completedLessons: 0,
          totalProgress: 0,
          averageProgress: 0
        }
      })
    }

    // Calculate user-specific stats
    const enrolledCourses = userData.enrolledCourses.length
    let totalLessons = 0
    let completedLessons = 0
    let totalProgress = 0

    // Calculate stats from enrolled courses
    for (const courseId of userData.enrolledCourses) {
      try {
        // Handle both string and ObjectId formats
        const objectId = typeof courseId === 'string' ? new ObjectId(courseId) : courseId
        const course = await db.getCourseWithLessons(objectId)

        if (course && course.isActive) {
          totalLessons += course.lessons?.length || 0

          // Get user progress for this course
          const progress = await db.getUserProgress(new ObjectId(userId), objectId)
          totalProgress += progress.progress || 0
          completedLessons += progress.completedLessons?.length || 0
        }
      } catch (error) {
        console.error("Error calculating stats for course:", courseId, error)
      }
    }

    const averageProgress = enrolledCourses > 0 ? Math.round(totalProgress / enrolledCourses) : 0

    return NextResponse.json({
      stats: {
        enrolledCourses,
        completedLessons,
        totalLessons,
        totalProgress,
        averageProgress
      }
    })
  } catch (error) {
    console.error("Failed to get user stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
