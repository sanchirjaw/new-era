import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { db } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()


    // Extract payment information from QPay callback
    const { invoice_id, payment_id, payment_status } = body

    if (!invoice_id) {
      return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 })
    }

    // Find payment by QPay invoice ID
    const client = await (await import("@/lib/mongodb")).default
    const db_conn = client.db("new-era-platform")
    const payment = await db_conn.collection("payments").findOne({ qpayInvoiceId: invoice_id })

    if (!payment) {

      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    if (payment_status === "PAID") {
      // Update payment status
      await db.updatePaymentStatus(new ObjectId(payment._id), "completed", payment_id, "qpay")

      // Create enrollment
      await db.createEnrollment({
        userId: payment.userId,
        courseId: payment.courseId,
        paymentId: new ObjectId(payment._id),
        enrolledAt: new Date(),
        completedLessons: [],
        progress: 0,
        isActive: true,
      })

      // Update user's enrolledCourses array
      await db.addCourseToUser(new ObjectId(payment.userId), new ObjectId(payment.courseId))
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Callback processing failed" }, { status: 500 })
  }
}
