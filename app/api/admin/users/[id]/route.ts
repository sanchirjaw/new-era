import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-server"
import { db } from "@/lib/database"
import bcrypt from "bcryptjs"
import { ObjectId } from "mongodb"
import { auth } from "@/auth"

// GET /api/admin/users/[id] - Get user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = new ObjectId(params.id)
    const user = await db.getUserById(userId)
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Remove sensitive information
    const { password, ...userWithoutPassword } = user
    return NextResponse.json({ user: userWithoutPassword })
  } catch (error) {
    console.error("Failed to get user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/admin/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check for NextAuth session first, then admin token
    const session = await auth()
    let user = null

    if (session?.user) {
      // NextAuth user - get full user data from database
      const dbUser = await db.getUserByEmail(session.user.email!)
      if (dbUser && dbUser.role === "admin") {
        user = { id: dbUser._id.toString(), role: dbUser.role }
      }
    } else {
      // Admin token
      const token = request.cookies.get("admin-token")?.value
      if (token) {
        user = verifyToken(token)
      }
    }

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = new ObjectId(params.id)
    const { name, email, password, role } = await request.json()

    // Validate input
    if (!name || !email || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!["student", "admin"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Check if user exists
    const existingUser = await db.getUserById(userId)
    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if email is already taken by another user
    if (email !== existingUser.email) {
      const userWithEmail = await db.getUserByEmail(email)
      if (userWithEmail && userWithEmail._id?.toString() !== params.id) {
        return NextResponse.json({ error: "Email already taken" }, { status: 409 })
      }
    }

    // Prepare update data
    const updateData: any = {
      name,
      email,
      role,
    }

    // Only update password if provided
    if (password && password.trim() !== "") {
      updateData.password = await bcrypt.hash(password, 12)
    }

    // Update user
    const success = await db.updateUser(userId, updateData)
    
    if (!success) {
      return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
    }

    return NextResponse.json({ message: "User updated successfully" })
  } catch (error) {
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check for NextAuth session first, then admin token
    const session = await auth()
    let user = null

    if (session?.user) {
      // NextAuth user - get full user data from database
      const dbUser = await db.getUserByEmail(session.user.email!)
      if (dbUser && dbUser.role === "admin") {
        user = { id: dbUser._id.toString(), role: dbUser.role }
      }
    } else {
      // Admin token
      const token = request.cookies.get("admin-token")?.value
      if (token) {
        user = verifyToken(token)
      }
    }

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = new ObjectId(params.id)

    // Check if user exists
    const existingUser = await db.getUserById(userId)
    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Prevent admin from deleting themselves
    if (user.id === params.id) {
      return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 })
    }

    // Delete user
    const success = await db.deleteUser(userId)
    
    if (!success) {
      return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
    }

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
