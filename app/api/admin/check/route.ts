import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-server"

export async function GET(request: NextRequest) {
  try {
    // Check for admin token
    const token = request.cookies.get("admin-token")?.value
    console.log("Admin check - token found:", !!token)
    
    if (!token) {
      console.log("Admin check - no token found")
      return NextResponse.json({ error: "No admin token" }, { status: 401 })
    }

    // Verify the admin token
    console.log("Admin check - verifying token...")
    const user = verifyToken(token)
    console.log("Admin check - user from token:", user ? { id: user.id, role: user.role } : null)
    
    if (!user || user.role !== "admin") {
      console.log("Admin check - invalid user or role:", user?.role)
      return NextResponse.json({ error: "Invalid admin token" }, { status: 403 })
    }

    return NextResponse.json({ 
      message: "Admin authenticated",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })
  } catch (error) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  }
}
