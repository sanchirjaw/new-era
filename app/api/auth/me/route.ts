import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-server"
import { auth } from "@/auth"

export async function GET(request: NextRequest) {
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
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Import database and ObjectId
    const { db } = await import("@/lib/database")
    const { ObjectId } = await import("mongodb")

    // Get full user data from database
    const userData = await db.getUserById(new ObjectId(user.id))
    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Auto-deactivate expired enrollments
    await db.deactivateExpiredEnrollments(new ObjectId(user.id))

    // Re-fetch user after potential expiry cleanup
    const freshUser = await db.getUserById(new ObjectId(user.id))
    const finalUser = freshUser || userData

    // Build enrollment expiry map: { courseId -> expiresAt | null }
    const enrollments = await db.getUserEnrollments(new ObjectId(user.id))
    const enrollmentExpiries: Record<string, string | null> = {}
    for (const e of enrollments) {
      const cid = e.courseId?.toString()
      if (cid) {
        enrollmentExpiries[cid] = e.expiresAt ? e.expiresAt.toISOString() : null
      }
    }

    // Return user data with additional fields
    return NextResponse.json({
      user: {
        id: finalUser._id?.toString(),
        email: finalUser.email,
        name: finalUser.name,
        role: finalUser.role,
        enrolledCourses: finalUser.enrolledCourses?.map((id: any) => id.toString()) || [],
        enrollmentExpiries,   // { courseId: "2026-01-01T..." | null }
        phone: finalUser.phone,
        address: finalUser.address,
        bio: finalUser.bio,
        createdAt: finalUser.createdAt,
        updatedAt: finalUser.updatedAt
      }
    })
  } catch (error) {
    console.error("Auth check error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
