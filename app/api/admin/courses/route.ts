import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-server"
import { connectDB } from "@/lib/database"

// GET /api/admin/courses
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("admin-token")?.value
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const user = verifyToken(token)
    if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const db = await connectDB()
    const raw = await db.collection("courses").find({}).sort({ createdAt: -1 }).toArray()
    const courses = raw.map(c => ({ ...c, _id: c._id.toString() }))
    return NextResponse.json({ courses })
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/admin/courses
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("admin-token")?.value
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const user = verifyToken(token)
    if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { title, description, price, originalPrice, accessDurationMonths, category, level, isActive, thumbnailUrl } = await request.json()

    if (!title || !description || !category || !level) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    if (!["beginner", "intermediate", "advanced"].includes(level)) {
      return NextResponse.json({ error: "Invalid level" }, { status: 400 })
    }

    const db = await connectDB()
    const result = await db.collection("courses").insertOne({
      title,
      description,
      price: price || 0,
      originalPrice: originalPrice || 0,
      accessDurationMonths: accessDurationMonths ?? null,
      category,
      level,
      duration: 0,
      lessons: [],
      enrolledCount: 0,
      rating: 0,
      totalRatings: 0,
      isActive: isActive !== false,
      thumbnailUrl: thumbnailUrl || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({ message: "Course created successfully", courseId: result.insertedId }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
