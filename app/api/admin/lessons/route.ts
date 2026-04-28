import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-server"
import { db } from "@/lib/database"
import { ObjectId } from "mongodb"
import { auth } from "@/auth"

// POST /api/admin/lessons - Create new lesson
export async function POST(request: NextRequest) {
  try {
    // Check for NextAuth session first, then admin token
    const session = await auth()
    let user = null

    if (session?.user) {
      // NextAuth user - get full user data from database
      const dbUser = await db.getUserByEmail(session.user.email!)
      if (dbUser && dbUser.role === "admin") {
        user = { id: dbUser._id.toString(), role: dbUser.role }
      }
    } else {
      // Admin token
      const token = request.cookies.get("admin-token")?.value
      if (token) {
        user = verifyToken(token)
      }
    }

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    console.log("Received lesson creation request:", body)

    const { title, description, subCourseId, order, isPreview, bunnyVideoId, videoUrl } = body

    // Validate input
    if (!title || !description || !subCourseId || !bunnyVideoId || !videoUrl) {
      return NextResponse.json({
        error: "Missing required fields",
        details: {
          title: !!title,
          description: !!description,
          subCourseId: !!subCourseId,
          bunnyVideoId: !!bunnyVideoId,
          videoUrl: !!videoUrl
        }
      }, { status: 400 })
    }

    // Convert subCourseId to ObjectId
    let objectId: ObjectId
    try {
      objectId = new ObjectId(subCourseId)
    } catch {
      return NextResponse.json({ error: "Invalid subCourseId format" }, { status: 400 })
    }

    // Create lesson
    try {
      const lessonId = await db.createLesson({
        title,
        description,
        subCourseId: objectId,
        order: order || 1,
        isPreview: isPreview || false,
        videoUrl, // Now set from Bunny.net upload
        duration: 0, // Will be calculated from video later
        bunnyVideoId, // Now set from Bunny.net upload
        tusUploadId: "" // Legacy field, can be removed later
      })

      return NextResponse.json({
        message: "Lesson created successfully",
        lessonId
      }, { status: 201 })
    } catch (dbError) {
      console.error("Database error during lesson creation:", dbError)
      throw new Error(`Database error: ${dbError instanceof Error ? dbError.message : 'Unknown database error'}`)
    }
  } catch (error) {
    console.error("Lesson creation error:", error)
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    })
    return NextResponse.json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET /api/admin/lessons?subCourseId=...
export async function GET(request: NextRequest) {
  try {
    // Check for NextAuth session first, then admin token
    const session = await auth()
    let user = null

    if (session?.user) {
      // NextAuth user - get full user data from database
      const dbUser = await db.getUserByEmail(session.user.email!)
      if (dbUser && dbUser.role === "admin") {
        user = { id: dbUser._id.toString(), role: dbUser.role }
      }
    } else {
      // Admin token
      const token = request.cookies.get("admin-token")?.value
      if (token) {
        user = verifyToken(token)
      }
    }

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const subCourseId = searchParams.get("subCourseId")
    if (!subCourseId) {
      return NextResponse.json({ error: "subCourseId query param is required" }, { status: 400 })
    }

    let objectId: ObjectId
    try {
      objectId = new ObjectId(subCourseId)
    } catch {
      return NextResponse.json({ error: "Invalid subCourseId" }, { status: 400 })
    }

    console.log("Fetching lessons for subCourseId:", subCourseId, "converted to ObjectId:", objectId)
    const lessons = await db.getLessonsBySubCourseId(objectId)
    console.log("Found lessons:", lessons.length)
    return NextResponse.json({ lessons })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
