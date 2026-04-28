import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
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

    return NextResponse.json(
      { message: "Token is valid" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Token validation error:", error)
    return NextResponse.json(
      { error: "Failed to validate token" },
      { status: 500 }
    )
  }
}
