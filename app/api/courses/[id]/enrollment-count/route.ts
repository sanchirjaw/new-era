import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { ObjectId } from "mongodb"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid course ID" }, { status: 400 })
    }

    const courseId = new ObjectId(id)
    const enrollmentCount = await db.getCourseEnrollmentCount(courseId)

    return NextResponse.json({ 
      enrollmentCount,
      courseId: id
    })
  } catch (error) {
    console.error("Error fetching enrollment count:", error)
    return NextResponse.json(
      { error: "Failed to fetch enrollment count" },
      { status: 500 }
    )
  }
}
