import { NextRequest, NextResponse } from "next/server"
import { getAdminUser } from "@/lib/auth-server"
import { db } from "@/lib/database"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  const admin = await getAdminUser(request)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { userId, courseId } = await request.json()
  if (!userId || !courseId) {
    return NextResponse.json({ error: "userId and courseId required" }, { status: 400 })
  }

  try {
    // Enrollment үүсгэ (dedup-тай тул давхардахгүй)
    await db.createEnrollment({
      userId: new ObjectId(userId),
      courseId: courseId,
      enrolledAt: new Date(),
      completedLessons: [],
      progress: 0,
      isActive: true,
    } as any)

    // enrolledCourses массивт нэмэ
    await db.addCourseToUser(new ObjectId(userId), new ObjectId(courseId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Manual enroll error:", error)
    return NextResponse.json({ error: "Enrollment failed" }, { status: 500 })
  }
}
