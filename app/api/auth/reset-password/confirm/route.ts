import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      )
    }

    // Find user with valid reset token using direct database query
    const client = await (await import("@/lib/mongodb")).default
    const dbInstance = client.db("new-era-platform")
    const user = await dbInstance.collection("users").findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Update user password and clear reset token
    await dbInstance.collection("users").updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          resetToken: undefined,
          resetTokenExpiry: undefined,
        }
      }
    )

    return NextResponse.json(
      { message: "Password reset successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Password reset confirmation error:", error)
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    )
  }
}
