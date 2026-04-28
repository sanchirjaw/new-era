import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { verifyToken } from "@/lib/auth-server"
import { db } from "@/lib/database"
import { auth } from "@/auth"

export async function POST(request: NextRequest) {
  try {
    // Check for NextAuth session first, then custom auth token
    const session = await auth()
    let user = null

    if (session?.user) {
      // NextAuth user
      user = {
        id: session.user.id!,
        email: session.user.email!,
        name: session.user.name!
      }
    } else {
      // Custom auth token
      const token = request.cookies.get("auth-token")?.value
      if (token) {
        user = verifyToken(token)
      }
    }

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { courseId } = await request.json()

    if (!courseId) {
      return NextResponse.json({ error: "Course ID is required" }, { status: 400 })
    }

    // Check if user has a completed payment for this course
    const client = await (await import("@/lib/mongodb")).default
    const db_conn = client.db("new-era-platform")

    const payment = await db_conn.collection("payments").findOne({
      userId: new ObjectId(user.id),
      courseId: new ObjectId(courseId),
      status: "completed"
    })

    if (!payment) {
      return NextResponse.json({ error: "No completed payment found" }, { status: 404 })
    }

    // Check if already enrolled
    const existingEnrollment = await db_conn.collection("enrollments").findOne({
      userId: new ObjectId(user.id),
      courseId: new ObjectId(courseId)
    })

    if (existingEnrollment) {
      // Ensure user has course in enrolledCourses array (single operation)
      await db_conn.collection("users").updateOne(
        { _id: new ObjectId(user.id) },
        { $addToSet: { enrolledCourses: courseId } }
      )
      return NextResponse.json({ message: "Already enrolled", enrolled: true })
    }

    // Use MongoDB transactions for atomic enrollment (faster and more reliable)
    const mongoSession = client.startSession()
    let enrollmentResult

    try {
      await mongoSession.withTransaction(async () => {
        // Create enrollment and update user in a single transaction
        enrollmentResult = await db_conn.collection("enrollments").insertOne({
          userId: new ObjectId(user.id),
          courseId: new ObjectId(courseId),
          paymentId: payment._id,
          enrolledAt: new Date(),
          completedLessons: [],
          progress: 0,
          isActive: true,
        }, { session: mongoSession })

        // Update user's enrolledCourses array
        await db_conn.collection("users").updateOne(
          { _id: new ObjectId(user.id) },
          { $addToSet: { enrolledCourses: courseId } },
          { session: mongoSession }
        )
      })
    } finally {
      await mongoSession.endSession()
    }

    return NextResponse.json({
      message: "Enrollment created successfully",
      enrolled: true,
      enrollmentId: enrollmentResult.insertedId.toString()
    })

  } catch (error) {
    console.error("Verify and enroll error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
