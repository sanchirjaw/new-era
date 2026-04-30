import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-server"
import { db } from "@/lib/database"
import { ObjectId } from "mongodb"
import { auth } from "@/auth"

function parseObjectId(id: string) {
  if (!ObjectId.isValid(id)) return null
  return new ObjectId(id)
}

// GET /api/admin/users/[id]/courses - Get user's enrolled courses
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    let adminUser: { id: string; role: string } | null = null

    if (session?.user?.email) {
      const dbUser = await db.getUserByEmail(session.user.email)
      if (dbUser?._id && dbUser.role === "admin") {
        adminUser = { id: dbUser._id.toString(), role: dbUser.role }
      }
    }

    if (!adminUser) {
      const token = request.cookies.get("admin-token")?.value
      if (token) adminUser = verifyToken(token)
    }

    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const userId = parseObjectId(id)
    if (!userId) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 })
    }

    const existingUser = await db.getUserById(userId)
    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      userId: id,
      enrolledCourses: (existingUser.enrolledCourses || []).map((courseId: any) => courseId.toString()),
    })
  } catch (error) {
    console.error("Failed to get user courses:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/admin/users/[id]/courses - Update user course access
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check NextAuth admin session first, then fall back to admin-token.
    const session = await auth()
    let adminUser: { id: string; role: string } | null = null

    if (session?.user?.email) {
      const dbUser = await db.getUserByEmail(session.user.email)
      if (dbUser?._id && dbUser.role === "admin") {
        adminUser = { id: dbUser._id.toString(), role: dbUser.role }
      }
    }

    if (!adminUser) {
      const token = request.cookies.get("admin-token")?.value
      if (token) adminUser = verifyToken(token)
    }

    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const userId = parseObjectId(id)
    if (!userId) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 })
    }

    const { courseIds, durationMonths } = await request.json()
    // durationMonths: number (1,3,6,12) or null = lifetime

    // Validate input
    if (!Array.isArray(courseIds)) {
      return NextResponse.json({ error: "courseIds must be an array" }, { status: 400 })
    }

    const validCourseIds = courseIds.filter((courseId: string) => ObjectId.isValid(courseId))
    if (validCourseIds.length !== courseIds.length) {
      return NextResponse.json({ error: "Invalid course ID format" }, { status: 400 })
    }

    // Check if user exists
    const existingUser = await db.getUserById(userId)
    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const client = await (await import("@/lib/mongodb")).default
    const db_conn = client.db("new-era-platform")

    const enrolledAt = new Date()
    const expiresAt = durationMonths
      ? new Date(enrolledAt.getTime() + durationMonths * 30 * 24 * 60 * 60 * 1000)
      : null

    // Upsert enrollment for each selected course
    for (const courseId of validCourseIds) {
      const existing = await db_conn.collection("enrollments").findOne({
        userId,
        courseId: new ObjectId(courseId)
      })
      if (existing) {
        // Renew/update expiry
        await db_conn.collection("enrollments").updateOne(
          { _id: existing._id },
          { $set: { isActive: true, expiresAt, enrolledAt } }
        )
      } else {
        await db_conn.collection("enrollments").insertOne({
          userId,
          courseId: new ObjectId(courseId),
          paymentId: new ObjectId(), // admin grant — no real payment
          enrolledAt,
          expiresAt,
          completedLessons: [],
          progress: 0,
          isActive: true,
        })
      }
    }

    // Remove enrollments for courses no longer in the list
    const removedCourseIds = (existingUser.enrolledCourses || [])
      .map((c: any) => c.toString())
      .filter((c: string) => !validCourseIds.includes(c))

    if (removedCourseIds.length > 0) {
      await db_conn.collection("enrollments").updateMany(
        { userId, courseId: { $in: removedCourseIds.map((c: string) => new ObjectId(c)) } },
        { $set: { isActive: false } }
      )
    }

    // Update user's enrolledCourses array
    await db.updateUser(userId, {
      enrolledCourses: validCourseIds.map((c: string) => new ObjectId(c)) as any
    })

    return NextResponse.json({
      message: "User course access updated successfully",
      enrolledCourses: validCourseIds,
      expiresAt: expiresAt?.toISOString() || null,
    })
  } catch (error) {
    console.error("Failed to update user course access:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
