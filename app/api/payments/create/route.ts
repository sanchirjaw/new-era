import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { verifyToken } from "@/lib/auth-server"
import { db } from "@/lib/database"
import { qpayService } from "@/lib/qpay"

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { courseId, phoneNumber } = await request.json()

    if (!courseId) {
      return NextResponse.json({ error: "Course ID is required" }, { status: 400 })
    }

    // Test database connection first
    try {
      await db.getStats() // Simple database test
    } catch (dbError) {
      console.error("Database connection error:", dbError)
      return NextResponse.json({
        error: "Database connection failed",
        details: dbError instanceof Error ? dbError.message : "Unknown database error"
      }, { status: 500 })
    }

    // Get course details
    const course = await db.getCourseById(new ObjectId(courseId))
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    // Create payment record
    const paymentId = await db.createPayment({
      userId: new ObjectId(user.id),
      courseId: new ObjectId(courseId),
      amount: course.price,
      currency: "MNT",
      status: "pending",
      paymentMethod: "qpay",
    })

    // Create QPay invoice
    const senderInvoiceNo = `NE-${paymentId.toString()}-${Date.now()}`
    const description = `New Era - ${course.title}`
    const callbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/callback`

    const qpayInvoice = await qpayService.createInvoice(course.price, description, senderInvoiceNo, callbackUrl)

    // Update payment with QPay invoice ID
    await db.updatePaymentStatus(paymentId, "pending", qpayInvoice.invoice_id, "qpay")

    return NextResponse.json({
      paymentId: paymentId.toString(),
      qpayInvoice,
      success: true,
    })
  } catch (error) {
    console.error("Payment creation error:", error)

    // Log more details for debugging
    if (error instanceof Error) {
      console.error("Error name:", error.name)
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }

    return NextResponse.json({
      error: "Failed to create payment",
      details: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
