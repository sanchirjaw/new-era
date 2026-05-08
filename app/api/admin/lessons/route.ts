import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-server"
import { connectDB } from "@/lib/database"
import { ObjectId } from "mongodb"

// POST /api/admin/lessons - Create new lesson
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("admin-token")?.value
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const user = verifyToken(token)
    if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = await request.json()
    const { title, description, content, subCourseId, order, isPreview, bunnyVideoId, videoUrl, thumbnailUrl } = body

    if (!title || !subCourseId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    let subCourseObjectId: ObjectId
    try { subCourseObjectId = new ObjectId(subCourseId) }
    catch { return NextResponse.json({ error: "Invalid subCourseId format" }, { status: 400 }) }

    const db = await connectDB()
    const result = await db.collection("lessons").insertOne({
      title,
      description: description || "",
      content: content || "",
      subCourseId: subCourseObjectId,
      order: order || 1,
      isPreview: isPreview || false,
      videoUrl: videoUrl || "",
      duration: 0,
      bunnyVideoId: bunnyVideoId || "",
      tusUploadId: "",
      ...(thumbnailUrl && { thumbnailUrl }),
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({ message: "Lesson created successfully", lessonId: result.insertedId }, { status: 201 })
  } catch (error) {
    console.error("Lesson creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET /api/admin/lessons?subCourseId=...  OR  ?library=true
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("admin-token")?.value
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const user = verifyToken(token)
    if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const db = await connectDB()

    // Library mode: return all lessons that have a bunnyVideoId (for reuse)
    if (searchParams.get("library") === "true") {
      const rawLessons = await db.collection("lessons")
        .find({ bunnyVideoId: { $exists: true, $ne: "" } })
        .sort({ createdAt: -1 })
        .toArray()
      const lessons = rawLessons.map(l => ({
        _id: l._id.toString(),
        title: l.title,
        bunnyVideoId: l.bunnyVideoId,
        videoUrl: l.videoUrl || "",
        thumbnailUrl: l.thumbnailUrl || "",
        duration: l.duration || 0,
        subCourseId: l.subCourseId?.toString() || "",
      }))
      return NextResponse.json({ lessons })
    }

    const subCourseId = searchParams.get("subCourseId")
    if (!subCourseId) return NextResponse.json({ error: "subCourseId required" }, { status: 400 })

    let subCourseObjectId: ObjectId
    try { subCourseObjectId = new ObjectId(subCourseId) }
    catch { return NextResponse.json({ error: "Invalid subCourseId" }, { status: 400 }) }

    const rawLessons = await db.collection("lessons")
      .find({ subCourseId: subCourseObjectId })
      .sort({ order: 1 })
      .toArray()

    const lessons = rawLessons.map(l => ({
      ...l,
      _id: l._id.toString(),
      subCourseId: l.subCourseId?.toString() || subCourseId,
    }))

    return NextResponse.json({ lessons })
  } catch (error) {
    console.error("Get lessons error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
