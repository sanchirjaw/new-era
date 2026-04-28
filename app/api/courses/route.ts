import { NextResponse } from "next/server"
import { Database } from "@/lib/database"

export async function GET() {
  try {
    const db = Database.getInstance()
    const courses = await db.getAllCourses()
    return NextResponse.json({ courses })
  } catch (error) {
    console.error("Error fetching courses:", error)
    return NextResponse.json({ courses: [] })
  }
}
