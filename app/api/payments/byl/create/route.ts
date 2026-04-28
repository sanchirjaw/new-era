import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { verifyToken } from "@/lib/auth-server"
import { db } from "@/lib/database"
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

    const { courseId, paymentMethod = "checkout" } = await request.json()

    if (!courseId) {
      return NextResponse.json({ error: "Course ID is required" }, { status: 400 })
    }

    // Get course details
    const course = await db.getCourseById(new ObjectId(courseId))
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    if (paymentMethod === "checkout") {
      // Create payment record first with temporary bylCheckoutId
      const tempCheckoutId = Date.now() // Temporary ID to avoid null
      const paymentId = await db.createPayment({
        userId: new ObjectId(user.id),
        courseId: new ObjectId(courseId),
        amount: course.price,
        currency: "MNT",
        status: "pending",
        paymentMethod: "byl",
        bylCheckoutId: tempCheckoutId
      })

      // Create Byl checkout
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
          process.env.NODE_ENV === 'production' ? 'https://edunewera.mn' : 'http://localhost:3000')
      const checkoutData = {
        cancel_url: `${baseUrl}/courses/${courseId}`,
        success_url: `${baseUrl}/courses/${courseId}?payment_success=true`,
        items: [
          {
            price_data: {
              unit_amount: course.price,
              product_data: {
                name: course.title,
                client_reference_id: courseId
              }
            },
            quantity: 1
          }
        ],
        phone_number_collection: false,
        customer_email: user.email,
        client_reference_id: courseId
      }

      const bylCheckout = await bylService.createCheckout(checkoutData)

      // Update payment with the actual Byl checkout ID
      await db.updatePaymentBylCheckoutId(paymentId, bylCheckout.id)

      return NextResponse.json({
        paymentId: paymentId.toString(),
        bylCheckout,
        success: true
      })
    } else {
      // Create Byl invoice
      const description = `New Era - ${course.title}`
      const bylInvoice = await bylService.createInvoice(course.price, description)

      // Create payment record
      const paymentId = await db.createPayment({
        userId: new ObjectId(user.id),
        courseId: new ObjectId(courseId),
        amount: course.price,
        currency: "MNT",
        status: "pending",
        paymentMethod: "byl",
        bylInvoiceId: bylInvoice.id
      })

      return NextResponse.json({
        paymentId: paymentId.toString(),
        bylInvoice,
        success: true
      })
    }
  } catch (error) {
    console.error("Byl payment creation error:", error)
    return NextResponse.json({ error: "Failed to create Byl payment" }, { status: 500 })
  }
}
