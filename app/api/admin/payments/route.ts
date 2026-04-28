import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-server"
import { db } from "@/lib/database"
import { ObjectId } from "mongodb"

// GET /api/admin/payments - Get all payments with user and course details
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const token = request.cookies.get("admin-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get all payments with user and course details
    const payments = await db.getAllPaymentsWithDetails()
    
    // Calculate stats
    const stats = {
      total: payments.length,
      successful: payments.filter(p => p.status === "completed").length,
      pending: payments.filter(p => p.status === "pending").length,
      failed: payments.filter(p => p.status === "failed").length
    }
    
    return NextResponse.json({ payments, stats })
  } catch (error) {
    console.error("Failed to fetch payments:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
