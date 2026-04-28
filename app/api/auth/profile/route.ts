import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { verifyToken } from "@/lib/auth-server"
import { db } from "@/lib/database"
import { auth } from "@/auth"
import bcrypt from "bcryptjs"

export async function GET(request: NextRequest) {
  try {
    // Try NextAuth session first
    const session = await auth()
    
    if (session?.user?.email) {
      const user = await db.getUserByEmail(session.user.email)
      
      if (user) {
        // Format user data properly
        return NextResponse.json({ 
          user: {
            id: user._id?.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            enrolledCourses: user.enrolledCourses?.map(id => id.toString()) || [],
            phone: user.phone || "",
            address: user.address || "",
            bio: user.bio || "",
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          }
        })
      }
    }
    
    // Fallback to custom auth
    const token = request.cookies.get("auth-token")?.value
    
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const userData = await db.getUserById(new ObjectId(user.id))
    
    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Format user data properly
    return NextResponse.json({ 
      user: {
        id: userData._id?.toString(),
        email: userData.email,
        name: userData.name,
        role: userData.role,
        enrolledCourses: userData.enrolledCourses?.map(id => id.toString()) || [],
        phone: userData.phone || "",
        address: userData.address || "",
        bio: userData.bio || "",
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt
      }
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    let userId: string | null = null

    // First try NextAuth.js session
    try {
      const session = await auth()
      if (session?.user?.id) {
        userId = session.user.id
      }
    } catch (error) {
      console.log("NextAuth session check failed, trying custom auth")
    }

    // If NextAuth failed, try custom auth token
    if (!userId) {
      const token = request.cookies.get("auth-token")?.value
      if (token) {
        const user = verifyToken(token)
        if (user) {
          userId = user.id
        }
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, phone, newPassword, confirmPassword } = body

    console.log("Profile update request body:", body)
    console.log("Phone value received:", phone)

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json({ 
        success: false,
        error: "Name and email are required" 
      }, { status: 400 })
    }

    // Check if email is already taken by another user
    const existingUser = await db.getUserById(new ObjectId(userId))
    if (!existingUser) {
      return NextResponse.json({ 
        success: false,
        error: "User not found" 
      }, { status: 404 })
    }

    console.log("Existing user phone:", existingUser.phone)

    if (email !== existingUser.email) {
      const userWithEmail = await db.getUserByEmail(email)
      if (userWithEmail && userWithEmail._id?.toString() !== userId) {
        return NextResponse.json({ 
          success: false,
          error: "Email is already taken by another user" 
        }, { status: 409 })
      }
    }

    // Validate password if provided
    if (newPassword || confirmPassword) {
      if (!newPassword || !confirmPassword) {
        return NextResponse.json({ error: "Both password fields are required" }, { status: 400 })
      }
      if (newPassword !== confirmPassword) {
        return NextResponse.json({ error: "Passwords do not match" }, { status: 400 })
      }
      if (newPassword.length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 })
      }
    }

    // Prepare update data
    const updateData: any = { name, email }
    
    // Always include phone field (even if empty string) to allow clearing it
    if (phone !== undefined) {
      updateData.phone = phone
      console.log("Phone field included in update:", { phone, phoneType: typeof phone, phoneLength: phone?.length })
    } else {
      console.log("Phone field not provided in request")
    }
    
    if (newPassword && confirmPassword && newPassword === confirmPassword) {
      updateData.password = await bcrypt.hash(newPassword, 12)
    }

    console.log("Update data to be sent to database:", updateData)
    console.log("Phone in update data:", updateData.phone)

    // Update user in database - handle invalid ObjectId
    let success;
    try {
      if (ObjectId.isValid(userId)) {
        success = await db.updateUser(new ObjectId(userId), updateData)
      } else {
        return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 })
      }
    } catch (error) {
      console.error("Error updating user:", error)
      return NextResponse.json({ error: "Invalid user ID" }, { status: 500 })
    }

    if (success) {
      return NextResponse.json({ 
        success: true,
        message: "Profile updated successfully" 
      })
    } else {
      return NextResponse.json({ 
        success: false,
        error: "Failed to update profile" 
      }, { status: 500 })
    }
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
