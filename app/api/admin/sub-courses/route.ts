import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-server"
import { connectDB } from "@/lib/database"
import { ObjectId } from "mongodb"

// GET /api/admin/sub-courses
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("admin-token")?.value
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const user = verifyToken(token)
    if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const db = await connectDB()
    const raw = await db.collection("sub_courses").find({}).sort({ order: 1 }).toArray()
    const subCourses = raw.map(sc => ({
      ...sc,
      _id: sc._id.toString(),
      courseId: sc.courseId?.toString() || "",
    }))
    const _debug = {
      dbName: db.databaseName,
      MONGODB_DB: process.env.MONGODB_DB || "(not set)",
      count: raw.length,
      firstIdType: raw[0]?._id?.constructor?.name ?? "none",
      firstId: raw[0]?._id?.toString() ?? "none",
    }
    return NextResponse.json({ subCourses, _debug })
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/admin/sub-courses
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("admin-token")?.value
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const user = verifyToken(token)
    if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { title, description, courseId, order, isActive } = await request.json()

    if (!title || !description || !courseId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await connectDB()
    const result = await db.collection("sub_courses").insertOne({
      title,
      description,
      courseId: new ObjectId(courseId),
      order: order || 1,
      lessons: [],
      isActive: isActive !== false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({ message: "Sub-course created successfully", subCourseId: result.insertedId }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
