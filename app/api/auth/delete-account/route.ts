import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-server"
import { db } from "@/lib/database"
import { ObjectId } from "mongodb"

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Delete user's enrollments first
    const enrollments = await db.getUserEnrollments(new ObjectId(user.id))
    for (const enrollment of enrollments) {
      await db.deleteEnrollment(enrollment._id!)
    }

    // Delete user's payments
    const payments = await db.getUserPayments(new ObjectId(user.id))
    for (const payment of payments) {
      await db.deletePayment(payment._id!)
    }

    // Finally delete the user
    const success = await db.deleteUser(new ObjectId(user.id))

    if (success) {
      // Clear the auth cookie
      const response = NextResponse.json({ message: "Account deleted successfully" })
      response.cookies.delete("auth-token")
      return response
    } else {
      return NextResponse.json({ error: "Failed to delete account" }, { status: 500 })
    }
  } catch (error) {
    console.error("Account deletion error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
