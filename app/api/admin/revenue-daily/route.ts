import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-server"
import { connectDB } from "@/lib/database"

// GET /api/admin/revenue-daily?year=2025&month=5
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("admin-token")?.value
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const user = verifyToken(token)
    if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const year  = parseInt(searchParams.get("year")  || String(new Date().getFullYear()))
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1)) // 1-indexed

    const start = new Date(year, month - 1, 1)
    const end   = new Date(year, month, 0, 23, 59, 59, 999)
    const daysInMonth = new Date(year, month, 0).getDate()

    const db = await connectDB()
    const [payments, expenses] = await Promise.all([
      db.collection("payments").find({ status: "completed", createdAt: { $gte: start, $lte: end } }).toArray(),
      db.collection("expenses").find({ date: { $gte: start, $lte: end } }).toArray(),
    ])

    // Build day-by-day array
    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1
      const dayStart = new Date(year, month - 1, day)
      const dayEnd   = new Date(year, month - 1, day, 23, 59, 59, 999)

      const rev = payments
        .filter(p => new Date(p.createdAt) >= dayStart && new Date(p.createdAt) <= dayEnd)
        .reduce((s, p) => s + (p.amount || 0), 0)

      const exp = expenses
        .filter(e => new Date(e.date) >= dayStart && new Date(e.date) <= dayEnd)
        .reduce((s, e) => s + (e.amount || 0), 0)

      return { day: String(day), revenue: rev, expenses: exp, profit: rev - exp }
    })

    return NextResponse.json({ days, year, month })
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
