import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-server"
import { db } from "@/lib/database"
import { cloudinaryService } from "@/lib/cloudinary"
import { ObjectId } from "mongodb"

// GET /api/admin/media - Get all media items
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

    // Get all media items
    const mediaItems = await db.getAllMediaItems()
    
    return NextResponse.json({ mediaItems })
  } catch (error) {
    console.error("Error fetching media items:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/admin/media - Upload new media item
export async function POST(request: NextRequest) {
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

    const formData = await request.formData()
    const file = formData.get('file') as File
    const name = formData.get('name') as string
    const description = formData.get('description') as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Only images are allowed." }, { status: 400 })
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large. Maximum size is 10MB." }, { status: 400 })
    }

    // Upload file using cloudinaryService
    console.log("Uploading file...")
    
    try {
      const uploadResult = await cloudinaryService.uploadFile(file, 'new-era-platform')
      console.log("Upload result:", uploadResult)
      
      // Create media item record
      const mediaItem = {
        name: name || file.name,
        description: description || '',
        type: file.type,
        size: file.size,
        originalName: file.name,
        uploadedBy: user.id,
        status: 'active',
        cloudinaryUrl: uploadResult,
        cloudinarySecureUrl: uploadResult
      }

      const mediaId = await db.createMediaItem(mediaItem)
      
      return NextResponse.json({ 
        message: "Media uploaded successfully",
        mediaId: mediaId.toString(),
        mediaItem: { ...mediaItem, id: mediaId.toString() }
      })
    } catch (uploadError) {
      console.error("Upload failed:", uploadError)
      return NextResponse.json({ 
        error: "Failed to upload file" 
      }, { status: 500 })
    }
  } catch (error) {
    console.error("Error uploading media:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
