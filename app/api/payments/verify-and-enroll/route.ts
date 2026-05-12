import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { verifyToken } from "@/lib/auth-server"
import { db } from "@/lib/database"
import { auth } from "@/auth"
import { bylService } from "@/lib/byl"

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

    // Check if user has a completed payment for this course
    const client = await (await import("@/lib/mongodb")).default
    const db_conn = client.db("new-era-platform")

    const payment = await db_conn.collection("payments").findOne({
      userId: new ObjectId(user.id),
      courseId: new ObjectId(courseId),
      status: "completed"
    })

    if (!payment) {
      // No completed payment — check if there's a pending Byl payment and verify it directly
      const pendingPayment = await db_conn.collection("payments").findOne({
        userId: new ObjectId(user.id),
        courseId: new ObjectId(courseId),
        status: "pending"
      })

      if (pendingPayment) {
        let bylPaid = false

        // Check Byl checkout status
        if (pendingPayment.bylCheckoutId) {
          try {
            const checkout = await bylService.getCheckout(pendingPayment.bylCheckoutId)
            if (checkout.status === "complete") bylPaid = true
          } catch {}
        }

        // Check Byl invoice status
        if (!bylPaid && pendingPayment.bylInvoiceId) {
          try {
            const invoice = await bylService.getInvoice(pendingPayment.bylInvoiceId)
            if (invoice.status === "paid") bylPaid = true
          } catch {}
        }

        if (!bylPaid) {
          return NextResponse.json({ error: "No completed payment found", enrolled: false }, { status: 404 })
        }

        // Mark payment as completed
        await db_conn.collection("payments").updateOne(
          { _id: pendingPayment._id },
          { $set: { status: "completed", updatedAt: new Date() } }
        )

        // Use the now-completed payment for enrollment below
        const course2 = await db_conn.collection("courses").findOne({ _id: new ObjectId(courseId) })
        const enrolledAt2 = new Date()
        const expiresAt2 = course2?.accessDurationMonths
          ? new Date(enrolledAt2.getTime() + course2.accessDurationMonths * 30 * 24 * 60 * 60 * 1000)
          : null

        await db_conn.collection("enrollments").updateOne(
          { userId: new ObjectId(user.id), courseId: new ObjectId(courseId) },
          { $set: { isActive: true, expiresAt: expiresAt2, enrolledAt: enrolledAt2 } },
          { upsert: true }
        )
        await db_conn.collection("users").updateOne(
          { _id: new ObjectId(user.id) },
          { $addToSet: { enrolledCourses: courseId } }
        )
        return NextResponse.json({ message: "Enrollment created via direct Byl check", enrolled: true })
      }

      return NextResponse.json({ error: "No completed payment found", enrolled: false }, { status: 404 })
    }

    // Look up course to get accessDurationMonths
    const course = await db_conn.collection("courses").findOne({ _id: new ObjectId(courseId) })
    const enrolledAt = new Date()
    const expiresAt = (course?.accessDurationMonths)
      ? new Date(enrolledAt.getTime() + course.accessDurationMonths * 30 * 24 * 60 * 60 * 1000)
      : null

    // Check if already enrolled
    const existingEnrollment = await db_conn.collection("enrollments").findOne({
      userId: new ObjectId(user.id),
      courseId: new ObjectId(courseId)
    })

    if (existingEnrollment) {
      // Renew expiry on re-payment
      await db_conn.collection("enrollments").updateOne(
        { _id: existingEnrollment._id },
        { $set: { isActive: true, expiresAt, enrolledAt } }
      )
      await db_conn.collection("users").updateOne(
        { _id: new ObjectId(user.id) },
        { $addToSet: { enrolledCourses: courseId } }
      )
      return NextResponse.json({ message: "Already enrolled", enrolled: true })
    }

    // Create enrollment (dedup-тай тул давхардахгүй)
    await db_conn.collection("enrollments").updateOne(
      { userId: new ObjectId(user.id), courseId: new ObjectId(courseId) },
      {
        $setOnInsert: {
          userId: new ObjectId(user.id),
          courseId: new ObjectId(courseId),
          paymentId: payment._id,
          enrolledAt,
          expiresAt,
          completedLessons: [],
          progress: 0,
          isActive: true,
        }
      },
      { upsert: true }
    )

    // Update user's enrolledCourses array
    await db_conn.collection("users").updateOne(
      { _id: new ObjectId(user.id) },
      { $addToSet: { enrolledCourses: courseId } }
    )

    return NextResponse.json({
      message: "Enrollment created successfully",
      enrolled: true,
    })

  } catch (error) {
    console.error("Verify and enroll error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
