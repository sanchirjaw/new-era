import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { verifyToken } from "@/lib/auth-server"
import { db } from "@/lib/database"
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

        // Dedup: return existing pending bank transfer within last 30 min
        const client = await (await import("@/lib/mongodb")).default
        const db_conn = client.db("new-era-platform")
        const existing = await db_conn.collection("payments").findOne({
            userId: new ObjectId(user.id),
            courseId: new ObjectId(courseId),
            status: "pending",
            paymentMethod: "bank_transfer",
            createdAt: { $gt: new Date(Date.now() - 30 * 60 * 1000) }
        })

        if (existing) {
            return NextResponse.json({
                success: true,
                paymentId: existing._id.toString(),
                bankAccount: "MN970004000418067243",
                phoneNumber: "99638369",
                amount: course.price,
                reference: existing.bankTransferReference || ""
            })
        }

        // Create new payment record for bank transfer
        const reference = `BT-${Date.now()}-${user.id.slice(-6)}`
        const paymentId = await db.createPayment({
            userId: new ObjectId(user.id),
            courseId: new ObjectId(courseId),
            amount: course.price,
            currency: "MNT",
            status: "pending",
            paymentMethod: "bank_transfer",
            bankTransferReference: reference,
        })

        return NextResponse.json({
            success: true,
            paymentId: paymentId.toString(),
            bankAccount: "MN970004000418067243",
            phoneNumber: "99638369",
            amount: course.price,
            reference
        })

    } catch (error) {
        console.error("Bank transfer payment creation error:", error)
        return NextResponse.json({
            error: "Failed to create bank transfer payment",
            details: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 })
    }
}
