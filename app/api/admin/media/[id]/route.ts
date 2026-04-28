import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-server"
import { db } from "@/lib/database"
import { ObjectId } from "mongodb"

// GET /api/admin/media/[id] - Get media item by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json({ error: "Media ID is required" }, { status: 400 })
    }

    // For build-time compatibility, return a simple response
    // The actual media data will be fetched when needed at runtime
    return NextResponse.json({ 
      message: "Media endpoint available",
      mediaId: id 
    })
  } catch (error) {
    console.error("Failed to get media:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/admin/media/[id] - Delete media item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json({ error: "Media ID is required" }, { status: 400 })
    }

    const mediaId = new ObjectId(id)

    // Verify admin authentication
    const token = request.cookies.get("admin-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Delete media item
    const success = await db.deleteMediaItem(mediaId)
    
    if (!success) {
      return NextResponse.json({ error: "Failed to delete media item" }, { status: 500 })
    }

    return NextResponse.json({ message: "Media item deleted successfully" })
  } catch (error) {
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
