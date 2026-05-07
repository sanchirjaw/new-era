import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-server"
import { connectDB } from "@/lib/database"
import { ObjectId } from "mongodb"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return NextResponse.json({ message: "Lesson endpoint available", lessonId: id })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get("admin-token")?.value
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const user = verifyToken(token)
    if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { id } = await params
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

    const db = await connectDB()

    let found: any = null
    try { found = await db.collection("lessons").findOne({ _id: new ObjectId(id) }) } catch {}
    if (!found) { found = await db.collection("lessons").findOne({ _id: id as any }) }
    if (!found) return NextResponse.json({ error: "Lesson not found" }, { status: 404 })

    await db.collection("lessons").deleteOne({ _id: found._id })
    return NextResponse.json({ message: "Lesson deleted successfully" })
  } catch (error: any) {
    console.error("DELETE lesson error:", error)
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get("admin-token")?.value
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const user = verifyToken(token)
    if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { id } = await params
    const updates = await request.json()
    const db = await connectDB()
    const result = await db.collection("lessons").updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updates, updatedAt: new Date() } }
    )
    if (result.matchedCount === 0) return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    return NextResponse.json({ message: "Lesson updated successfully" })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
