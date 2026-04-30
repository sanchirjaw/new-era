import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-server"
import { db } from "@/lib/database"
import bcrypt from "bcryptjs"
import { ObjectId } from "mongodb"
import { auth } from "@/auth"

export const dynamic = "force-dynamic"
export const revalidate = 0

// GET /api/admin/users - Get all users
export async function GET(request: NextRequest) {
  try {
    // Check NextAuth admin session first, then always fall back to admin token.
    // In production a non-admin NextAuth session may still exist in cookies.
    const session = await auth()
    let user: { id: string; role: string } | null = null

    if (session?.user) {
      // NextAuth user - get full user data from database
      const dbUser = await db.getUserByEmail(session.user.email!)
      if (dbUser?._id && dbUser.role === "admin") {
        user = { id: dbUser._id.toString(), role: dbUser.role }
      }
    }

    if (!user) {
      const token = request.cookies.get("admin-token")?.value
      if (token) {
        user = verifyToken(token)
      }
    }

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all users
    const users = await db.getAllUsers()

    // Enrich each user with enrollmentExpiries from enrollments collection
    const client = await (await import("@/lib/mongodb")).default
    const db_conn = client.db("new-era-platform")

    const enrichedUsers = await Promise.all(users.map(async (u: any) => {
      const enrollments = await db_conn.collection("enrollments").find({
        userId: u._id,
        isActive: true
      }).toArray()
      const enrollmentExpiries: Record<string, string | null> = {}
      for (const e of enrollments) {
        enrollmentExpiries[e.courseId?.toString()] = e.expiresAt ? e.expiresAt.toISOString() : null
      }
      return { ...u, enrollmentExpiries }
    }))

    return NextResponse.json(
      { users: enrichedUsers },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    )
  } catch (error) {
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/admin/users - Create new user
export async function POST(request: NextRequest) {
  try {
    // Check NextAuth admin session first, then always fall back to admin token.
    // In production a non-admin NextAuth session may still exist in cookies.
    const session = await auth()
    let user: { id: string; role: string } | null = null

    if (session?.user) {
      // NextAuth user - get full user data from database
      const dbUser = await db.getUserByEmail(session.user.email!)
      if (dbUser?._id && dbUser.role === "admin") {
        user = { id: dbUser._id.toString(), role: dbUser.role }
      }
    }

    if (!user) {
      const token = request.cookies.get("admin-token")?.value
      if (token) {
        user = verifyToken(token)
      }
    }

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, email, password, role } = await request.json()

    // Validate input
    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!["student", "admin"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await db.getUserByEmail(email)
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const userId = await db.createUser({
      name,
      email,
      password: hashedPassword,
      role,
      enrolledCourses: [],
    })

    return NextResponse.json({ 
      message: "User created successfully",
      userId 
    }, { status: 201 })
  } catch (error) {
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
