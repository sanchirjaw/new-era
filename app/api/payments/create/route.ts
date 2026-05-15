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

    // Get course details
    const course = await db.getCourseById(new ObjectId(courseId))
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    // Dedup: return existing pending QPay payment within last 30 min
    const client = await (await import("@/lib/mongodb")).default
    const db_conn = client.db("new-era-platform")
    const existing = await db_conn.collection("payments").findOne({
      userId: new ObjectId(user.id),
      courseId: new ObjectId(courseId),
      status: "pending",
      paymentMethod: "qpay",
      createdAt: { $gt: new Date(Date.now() - 30 * 60 * 1000) }
    })

    if (existing?.qpayInvoiceId) {
      // Return existing invoice
      return NextResponse.json({
        paymentId: existing._id.toString(),
        qpayInvoice: {
          invoice_id: existing.qpayInvoiceId,
          qr_image: existing.qpayQrImage || "",
          qr_text: existing.qpayQrText || "",
          urls: existing.qpayUrls || [],
        },
        success: true,
      })
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
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://edunewera.mn"}/api/payments/callback`

    const qpayInvoice = await qpayService.createInvoice(course.price, description, senderInvoiceNo, callbackUrl)

    // Update payment with QPay invoice ID + cache QR data
    await db.updatePaymentStatus(paymentId, "pending", qpayInvoice.invoice_id, "qpay")
    await db_conn.collection("payments").updateOne(
      { _id: paymentId },
      { $set: {
        qpayQrImage: qpayInvoice.qr_image,
        qpayQrText: qpayInvoice.qr_text,
        qpayUrls: qpayInvoice.urls || [],
      }}
    )

    return NextResponse.json({
      paymentId: paymentId.toString(),
      qpayInvoice,
      success: true,
    })
  } catch (error) {
    console.error("QPay payment creation error:", error)
    return NextResponse.json({
      error: "Failed to create payment",
      details: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 })
  }
}
