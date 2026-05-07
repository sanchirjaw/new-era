import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-server"
import { connectDB } from "@/lib/database"
import { ObjectId } from "mongodb"

// GET /api/admin/expenses
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("admin-token")?.value
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const user = verifyToken(token)
    if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const year  = parseInt(searchParams.get("year")  || String(new Date().getFullYear()))
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1)) // 1-indexed

    const db = await connectDB()
    const start = new Date(year, month - 1, 1)
    const end   = new Date(year, month, 0, 23, 59, 59, 999)

    const expenses = await db.collection("expenses")
      .find({ date: { $gte: start, $lte: end } })
      .sort({ date: -1 })
      .toArray()

    return NextResponse.json({ expenses })
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/admin/expenses
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("admin-token")?.value
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const user = verifyToken(token)
    if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { description, amount, category, date } = await request.json()
    if (!description || !amount || !date) {
      return NextResponse.json({ error: "description, amount, date шаардлагатай" }, { status: 400 })
    }

    const db = await connectDB()
    const result = await db.collection("expenses").insertOne({
      description,
      amount: Number(amount),
      category: category || "Бусад",
      date: new Date(date),
      createdAt: new Date(),
    })

    return NextResponse.json({ success: true, id: result.insertedId }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
