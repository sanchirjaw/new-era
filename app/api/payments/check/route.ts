import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { verifyToken } from "@/lib/auth-server"
import { db } from "@/lib/database"
import { qpayService } from "@/lib/qpay"
import { bylService } from "@/lib/byl"
import { auth } from "@/auth"

export async function POST(request: NextRequest) {
  try {
    // Check for NextAuth session first, then custom auth token
    const session = await auth()
    let user = null

    if (session?.user) {
      // NextAuth user
      user = {
        id: session.user.id!,
        email: session.user.email!,
        name: session.user.name!
      }
    } else {
      // Custom auth token
      const token = request.cookies.get("auth-token")?.value
      if (!token) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 })
      }

      user = verifyToken(token)
      if (!user) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 })
      }
    }

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { paymentId } = await request.json()

    if (!paymentId) {
      return NextResponse.json({ error: "Payment ID is required" }, { status: 400 })
    }

    // Get payment from database
    const client = await (await import("@/lib/mongodb")).default
    const db_conn = client.db("new-era-platform")
    const payment = await db_conn.collection("payments").findOne({ _id: new ObjectId(paymentId) })

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    if (payment.status === "completed") {
      return NextResponse.json({ status: "completed", payment })
    }

    // Check payment status with QPay
    if (payment.qpayInvoiceId) {
      const qpayStatus = await qpayService.checkPayment(payment.qpayInvoiceId)

      if (qpayStatus.payment_status === "PAID") {
        // Update payment status
        await db.updatePaymentStatus(new ObjectId(paymentId), "completed", qpayStatus.payment_id, "qpay")

        // Create enrollment
        await db.createEnrollment({
          userId: new ObjectId(user.id),
          courseId: payment.courseId,
          paymentId: new ObjectId(paymentId),
          enrolledAt: new Date(),
          completedLessons: [],
          progress: 0,
          isActive: true,
        })

        // Update user's enrolledCourses array
        await db.addCourseToUser(new ObjectId(user.id), new ObjectId(payment.courseId))

        return NextResponse.json({ status: "completed", payment: { ...payment, status: "completed" } })
      }
    }

    // Check payment status with Byl
    if (payment.bylInvoiceId) {
      try {
        const bylInvoice = await bylService.getInvoice(payment.bylInvoiceId)

        if (bylInvoice.status === "paid") {
          // Update payment status
          await db.updatePaymentStatus(new ObjectId(paymentId), "completed", bylInvoice.id.toString(), "byl")

          // Create enrollment
          await db.createEnrollment({
            userId: new ObjectId(user.id),
            courseId: payment.courseId,
            paymentId: new ObjectId(paymentId),
            enrolledAt: new Date(),
            completedLessons: [],
            progress: 0,
            isActive: true,
          })

          // Update user's enrolledCourses array
          await db.addCourseToUser(new ObjectId(user.id), new ObjectId(payment.courseId))

          return NextResponse.json({ status: "completed", payment: { ...payment, status: "completed" } })
        }
      } catch (error) {
        console.error("Error checking Byl invoice:", error)
      }
    }

    // Check payment status with Byl checkout
    if (payment.bylCheckoutId) {
      try {
        const bylCheckout = await bylService.getCheckout(payment.bylCheckoutId)

        if (bylCheckout.status === "complete") {
          // Update payment status
          await db.updatePaymentStatus(new ObjectId(paymentId), "completed", bylCheckout.id.toString(), "byl")

          // Create enrollment
          await db.createEnrollment({
            userId: new ObjectId(user.id),
            courseId: payment.courseId,
            paymentId: new ObjectId(paymentId),
            enrolledAt: new Date(),
            completedLessons: [],
            progress: 0,
            isActive: true,
          })

          return NextResponse.json({ status: "completed", payment: { ...payment, status: "completed" } })
        }
      } catch (error) {
        console.error("Error checking Byl checkout:", error)
      }
    }

    return NextResponse.json({ status: payment.status, payment })
  } catch (error) {

    return NextResponse.json({ error: "Failed to check payment" }, { status: 500 })
  }
}
