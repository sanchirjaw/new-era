import { NextRequest, NextResponse } from "next/server"
import { getAdminUser } from "@/lib/auth-server"
import { db } from "@/lib/database"
import { ObjectId } from "mongodb"

// POST /api/admin/lessons - Create new lesson
export async function POST(request: NextRequest) {
  try {
    const user = await getAdminUser(request)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { title, description, subCourseId, order, isPreview, bunnyVideoId, videoUrl } = body

    if (!title || !subCourseId || !bunnyVideoId || !videoUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    let objectId: ObjectId
    try {
      objectId = new ObjectId(subCourseId)
    } catch {
      return NextResponse.json({ error: "Invalid subCourseId format" }, { status: 400 })
    }

    const lessonId = await db.createLesson({
      title,
      description: description || "",
      subCourseId: objectId,
      order: order || 1,
      isPreview: isPreview || false,
      videoUrl,
      duration: 0,
      bunnyVideoId,
      tusUploadId: ""
    })

    return NextResponse.json({ message: "Lesson created successfully", lessonId }, { status: 201 })
  } catch (error) {
    console.error("Lesson creation error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 })
  }
}

// GET /api/admin/lessons?subCourseId=...
export async function GET(request: NextRequest) {
  try {
    const user = await getAdminUser(request)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const subCourseId = searchParams.get("subCourseId")
    if (!subCourseId) return NextResponse.json({ error: "subCourseId required" }, { status: 400 })

    let objectId: ObjectId
    try {
      objectId = new ObjectId(subCourseId)
    } catch {
      return NextResponse.json({ error: "Invalid subCourseId" }, { status: 400 })
    }

    const lessons = await db.getLessonsBySubCourseId(objectId)
    return NextResponse.json({ lessons })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
