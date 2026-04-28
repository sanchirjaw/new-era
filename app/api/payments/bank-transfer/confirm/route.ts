import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { verifyToken } from "@/lib/auth-server"
import { db } from "@/lib/database"

export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get("auth-token")?.value
        if (!token) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 })
        }

        const user = verifyToken(token)
        if (!user || user.role !== "admin") {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 })
        }

        const { paymentId, transactionReference } = await request.json()

        if (!paymentId) {
            return NextResponse.json({ error: "Payment ID is required" }, { status: 400 })
        }

        // Get payment details
        const client = await (await import("@/lib/mongodb")).default
        const db_conn = client.db("new-era-platform")

        const payment = await db_conn.collection("payments").findOne({
            _id: new ObjectId(paymentId),
            paymentMethod: "bank_transfer",
            status: "pending"
        })

        if (!payment) {
            return NextResponse.json({ error: "Bank transfer payment not found" }, { status: 404 })
        }

        // Use MongoDB transactions for atomic operations
        const session = client.startSession()

        try {
            await session.withTransaction(async () => {
                // Update payment status
                await db_conn.collection("payments").updateOne(
                    { _id: new ObjectId(paymentId) },
                    {
                        $set: {
                            status: "completed",
                            bankTransferReference: transactionReference || payment.bankTransferReference,
                            updatedAt: new Date()
                        }
                    },
                    { session }
                )

                // Create enrollment
                await db_conn.collection("enrollments").insertOne({
                    userId: payment.userId,
                    courseId: payment.courseId,
                    paymentId: new ObjectId(paymentId),
                    enrolledAt: new Date(),
                    completedLessons: [],
                    progress: 0,
                    isActive: true,
                }, { session })

                // Update user's enrolledCourses array
                await db_conn.collection("users").updateOne(
                    { _id: payment.userId },
                    { $addToSet: { enrolledCourses: payment.courseId.toString() } },
                    { session }
                )
            })
        } finally {
            await session.endSession()
        }

        return NextResponse.json({
            success: true,
            message: "Bank transfer payment confirmed and user enrolled"
        })

    } catch (error) {
        console.error("Bank transfer confirmation error:", error)
        return NextResponse.json({
            error: "Failed to confirm bank transfer payment",
            details: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 })
    }
}
