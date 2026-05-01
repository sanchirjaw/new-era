import { NextRequest, NextResponse } from "next/server"
import { getAdminUser } from "@/lib/auth-server"
import { db } from "@/lib/database"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return NextResponse.json({ message: "Lesson endpoint available", lessonId: params.id })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAdminUser(request)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    let lessonId: ObjectId
    try { lessonId = new ObjectId(params.id) }
    catch { return NextResponse.json({ error: "Invalid lesson id" }, { status: 400 }) }

    const success = await db.deleteLesson(lessonId)
    if (!success) return NextResponse.json({ error: "Failed to delete lesson" }, { status: 500 })
    return NextResponse.json({ message: "Lesson deleted successfully" })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAdminUser(request)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    let lessonId: ObjectId
    try { lessonId = new ObjectId(params.id) }
    catch { return NextResponse.json({ error: "Invalid lesson id" }, { status: 400 }) }

    const updates = await request.json()
    const success = await db.updateLesson(lessonId, updates)
    if (!success) return NextResponse.json({ error: "Failed to update lesson" }, { status: 500 })
    return NextResponse.json({ message: "Lesson updated successfully" })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
