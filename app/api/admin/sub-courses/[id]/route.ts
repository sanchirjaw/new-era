import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-server"
import { connectDB } from "@/lib/database"
import { ObjectId } from "mongodb"

// GET /api/admin/sub-courses/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db = await connectDB()
    const subCourse = await db.collection("sub_courses").findOne({ _id: new ObjectId(id) })
    if (!subCourse) return NextResponse.json({ error: "Sub-course not found" }, { status: 404 })
    return NextResponse.json({ subCourse: { ...subCourse, _id: subCourse._id.toString() } })
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/admin/sub-courses/[id]
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
    const result = await db.collection("sub_courses").updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updates, updatedAt: new Date() } }
    )
    if (result.matchedCount === 0) return NextResponse.json({ error: "Sub-course not found" }, { status: 404 })
    return NextResponse.json({ message: "Sub-course updated successfully" })
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/admin/sub-courses/[id]
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
    try { found = await db.collection("sub_courses").findOne({ _id: new ObjectId(id) }) } catch {}
    if (!found) { found = await db.collection("sub_courses").findOne({ _id: id as any }) }
    if (!found) return NextResponse.json({ error: "Sub-course not found" }, { status: 404 })

    await db.collection("sub_courses").deleteOne({ _id: found._id })
    return NextResponse.json({ message: "Sub-course deleted successfully" })
  } catch (e: any) {
    console.error("DELETE sub-course error:", e)
    return NextResponse.json({ error: e?.message || "Internal server error" }, { status: 500 })
  }
}
