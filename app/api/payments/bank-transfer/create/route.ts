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
        if (!user) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 })
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

        // Create payment record for bank transfer
        const paymentId = await db.createPayment({
            userId: new ObjectId(user.id),
            courseId: new ObjectId(courseId),
            amount: course.price,
            currency: "MNT",
            status: "pending",
            paymentMethod: "bank_transfer",
            bankTransferReference: `BT-${Date.now()}-${user.id.slice(-6)}`, // Generate reference
        })

        return NextResponse.json({
            success: true,
            paymentId: paymentId.toString(),
            bankAccount: "MN970004000418067243",
            phoneNumber: "99638369",
            amount: course.price,
            reference: `BT-${Date.now()}-${user.id.slice(-6)}`
        })

    } catch (error) {
        console.error("Bank transfer payment creation error:", error)
        return NextResponse.json({
            error: "Failed to create bank transfer payment",
            details: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 })
    }
}
