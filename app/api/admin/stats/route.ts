import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-server"
import { connectDB } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("admin-token")?.value
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload || payload.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const db = await connectDB()

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

    // Build last 6 months labels
    const months: { label: string; start: Date; end: Date }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({
        label: d.toLocaleDateString("mn-MN", { month: "short" }),
        start: new Date(d.getFullYear(), d.getMonth(), 1),
        end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59),
      })
    }

    const [
      totalUsers,
      newUsersThisMonth,
      newUsersLastMonth,
      totalCourses,
      activeCourses,
      allPayments,
      allEnrollments,
      subCourses,
      lessons,
      pendingPayments,
      topCoursesRaw,
    ] = await Promise.all([
      db.collection("users").countDocuments(),
      db.collection("users").countDocuments({ createdAt: { $gte: startOfMonth } }),
      db.collection("users").countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
      db.collection("courses").countDocuments(),
      db.collection("courses").countDocuments({ isActive: true }),
      db.collection("payments").find({ status: "completed" }).toArray(),
      db.collection("enrollments").find({}).toArray(),
      db.collection("sub_courses").countDocuments(),
      db.collection("lessons").countDocuments(),
      db.collection("payments").countDocuments({ status: "pending" }),
      db.collection("courses").find({}, { projection: { title: 1, enrolledCount: 1, price: 1, thumbnailUrl: 1 } })
        .sort({ enrolledCount: -1 }).limit(5).toArray(),
    ])

    const totalRevenue = allPayments.reduce((s, p) => s + (p.amount || 0), 0)
    const thisMonthRevenue = allPayments
      .filter(p => p.createdAt && new Date(p.createdAt) >= startOfMonth)
      .reduce((s, p) => s + (p.amount || 0), 0)
    const lastMonthRevenue = allPayments
      .filter(p => p.createdAt && new Date(p.createdAt) >= startOfLastMonth && new Date(p.createdAt) <= endOfLastMonth)
      .reduce((s, p) => s + (p.amount || 0), 0)

    const thisMonthEnrollments = allEnrollments.filter(
      e => e.enrolledAt && new Date(e.enrolledAt) >= startOfMonth
    ).length
    const lastMonthEnrollments = allEnrollments.filter(
      e => e.enrolledAt && new Date(e.enrolledAt) >= startOfLastMonth && new Date(e.enrolledAt) <= endOfLastMonth
    ).length

    // Revenue & enrollment by month (last 6)
    const revenueByMonth = months.map(m => ({
      month: m.label,
      revenue: allPayments
        .filter(p => p.createdAt && new Date(p.createdAt) >= m.start && new Date(p.createdAt) <= m.end)
        .reduce((s, p) => s + (p.amount || 0), 0),
      enrollments: allEnrollments.filter(
        e => e.enrolledAt && new Date(e.enrolledAt) >= m.start && new Date(e.enrolledAt) <= m.end
      ).length,
    }))

    // Payment method breakdown
    const byMethod: Record<string, number> = {}
    for (const p of allPayments) {
      const m = p.paymentMethod || "other"
      byMethod[m] = (byMethod[m] || 0) + p.amount
    }

    const topCourses = topCoursesRaw.map(c => ({
      _id: c._id.toString(),
      title: c.title,
      enrolledCount: c.enrolledCount || 0,
      price: c.price || 0,
      thumbnailUrl: c.thumbnailUrl || null,
    }))

    // Trend helpers
    const pct = (cur: number, prev: number) =>
      prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 100)

    return NextResponse.json({
      // Totals
      totalUsers,
      totalCourses,
      activeCourses,
      totalRevenue,
      subCourses,
      lessons,
      pendingPayments,
      totalEnrollments: allEnrollments.length,

      // This month
      thisMonthRevenue,
      thisMonthEnrollments,
      newUsersThisMonth,

      // Trends (% change vs last month)
      revenueTrend: pct(thisMonthRevenue, lastMonthRevenue),
      enrollmentTrend: pct(thisMonthEnrollments, lastMonthEnrollments),
      userTrend: pct(newUsersThisMonth, newUsersLastMonth),

      // Charts
      revenueByMonth,
      byMethod,

      // Top courses
      topCourses,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
