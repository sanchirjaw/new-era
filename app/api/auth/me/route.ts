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

    // Return user data with additional fields
    return NextResponse.json({
      user: {
        id: userData._id?.toString(),
        email: userData.email,
        name: userData.name,
        role: userData.role,
        enrolledCourses: userData.enrolledCourses?.map(id => id.toString()) || [],
        phone: userData.phone,
        address: userData.address,
        bio: userData.bio,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt
      }
    })
  } catch (error) {
    console.error("Auth check error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
