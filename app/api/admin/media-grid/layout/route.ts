import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-server"
import { db } from "@/lib/database"

// GET /api/admin/media-grid/layout - Get grid layout
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const token = request.cookies.get("admin-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get grid layout
    const layout = await db.getMediaGridLayout()
    
    return NextResponse.json({ layout })
  } catch (error) {
    console.error("Error fetching grid layout:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/admin/media-grid/layout - Update grid layout
export async function PUT(request: NextRequest) {
  try {
    // Verify admin authentication
    const token = request.cookies.get("admin-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const layout = await request.json()
    console.log("Updating grid layout:", {
      width: layout.width,
      height: layout.height,
      cellsCount: layout.cells?.length,
      isPublished: layout.isPublished
    })

    // Filter out immutable fields that can't be updated
    const { _id, createdAt, ...updateableLayout } = layout
    
    // Update grid layout
    const success = await db.updateMediaGridLayout(updateableLayout)
    
    if (!success) {
      console.error("Database update failed for grid layout")
      return NextResponse.json({ error: "Failed to update grid layout" }, { status: 500 })
    }

    console.log("Grid layout updated successfully")
    return NextResponse.json({ message: "Grid layout updated successfully" })
  } catch (error) {
    console.error("Error updating grid layout:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
