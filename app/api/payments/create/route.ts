import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { verifyToken } from "@/lib/auth-server"
import { db } from "@/lib/database"
import { qpayService } from "@/lib/qpay"
import { auth } from "@/auth"

export async function POST(request: NextRequest) {
  try {
    // Support both NextAuth session and custom auth token
    const session = await auth()
    let user = null

    if (session?.user) {
      user = {
        id: session.user.id!,
        email: session.user.email!,
        name: session.user.name!
      }
    } else {
      const token = request.cookies.get("auth-token")?.value
      if (token) {
        user = verifyToken(token)
      }
    }

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { courseId } = await request.json()
    if (!courseId) {
      return NextResponse.json({ error: "Course ID is required" }, { status: 400 })
    }

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
    const senderInvoiceNo = `NE-${paymentId.toString().slice(-8)}-${Date.now().toString().slice(-6)}`
    const description = `NewEra - ${course.title}`
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://edunewera.mn"}/api/payments/callback`

    const qpayInvoice = await qpayService.createInvoice(course.price, description, senderInvoiceNo, callbackUrl)

    // Save QPay invoice ID
    await db.updatePaymentStatus(paymentId, "pending", qpayInvoice.invoice_id, "qpay")

    return NextResponse.json({
      paymentId: paymentId.toString(),
      qpayInvoice,
      success: true,
    })
  } catch (error) {
    console.error("QPay payment creation error:", error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : "QPay invoice үүсгэхэд алдаа гарлаа",
    }, { status: 500 })
  }
}
