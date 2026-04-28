import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    // Clear the admin token
    const cookieStore = await cookies()
    cookieStore.set("admin-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0, // Expire immediately
    })

    return NextResponse.json({ message: "Admin logged out successfully" })
  } catch (error) {
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 })
  }
}
