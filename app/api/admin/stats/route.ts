import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-server"
import { connectDB } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const token = request.cookies.get("admin-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const db = await connectDB()

    // Get statistics
    const [totalUsers, totalCourses, payments, enrollments] = await Promise.all([
      db.collection("users").countDocuments(),
      db.collection("courses").countDocuments(),
      db.collection("payments").find({ status: "completed" }).toArray(),
      db
        .collection("enrollments")
        .find({
          createdAt: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        })
        .toArray(),
    ])

    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0)
    const thisMonthEnrollments = enrollments.length

    return NextResponse.json({
      totalUsers,
      totalCourses,
      totalRevenue,
      thisMonthEnrollments,
    })
  } catch (error) {
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
