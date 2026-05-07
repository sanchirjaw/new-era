import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-server"
import { connectDB } from "@/lib/database"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return NextResponse.json({ message: "Lesson endpoint available", lessonId: params.id })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get("admin-token")?.value
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const user = verifyToken(token)
    if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    let lessonId: ObjectId
    try { lessonId = new ObjectId(params.id) }
    catch { return NextResponse.json({ error: "Invalid lesson id" }, { status: 400 }) }

    const db = await connectDB()
    const result = await db.collection("lessons").deleteOne({ _id: lessonId })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Lesson deleted successfully" })
  } catch (error) {
    console.error("Delete lesson error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get("admin-token")?.value
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const user = verifyToken(token)
    if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    let lessonId: ObjectId
    try { lessonId = new ObjectId(params.id) }
    catch { return NextResponse.json({ error: "Invalid lesson id" }, { status: 400 }) }

    const updates = await request.json()
    const db = await connectDB()
    const result = await db.collection("lessons").updateOne(
      { _id: lessonId },
      { $set: { ...updates, updatedAt: new Date() } }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Lesson updated successfully" })
  } catch (error) {
    console.error("Update lesson error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
