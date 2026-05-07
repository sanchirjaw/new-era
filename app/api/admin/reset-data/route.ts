import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-server"
import { connectDB } from "@/lib/database"

// POST /api/admin/reset-data
// Deletes: non-admin users, payments, enrollments, expenses, userProgress
// Keeps:   admin, courses, sub_courses, lessons, media
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("admin-token")?.value
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const user = verifyToken(token)
    if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const db = await connectDB()

    const [
      delUsers,
      delPayments,
      delEnrollments,
      delExpenses,
      delProgress,
      resetCourses,
    ] = await Promise.all([
      db.collection("users").deleteMany({ role: { $ne: "admin" } }),
      db.collection("payments").deleteMany({}),
      db.collection("enrollments").deleteMany({}),
      db.collection("expenses").deleteMany({}),
      db.collection("userProgress").deleteMany({}),
      db.collection("courses").updateMany({}, { $set: { enrolledCount: 0 } }),
    ])

    return NextResponse.json({
      success: true,
      deleted: {
        users: delUsers.deletedCount,
        payments: delPayments.deletedCount,
        enrollments: delEnrollments.deletedCount,
        expenses: delExpenses.deletedCount,
        userProgress: delProgress.deletedCount,
        coursesReset: resetCourses.modifiedCount,
      },
    })
  } catch (e) {
    console.error("Reset error:", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
