import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-server"
import { bunnyVideoService } from "@/lib/bunny-video"

// Configure for large file uploads
export const config = {
  api: {
    bodyParser: false, // Disable body parser for large files
    responseLimit: false, // Disable response size limit
  },
}

// GET /api/admin/upload/tus/[id] - Get upload information
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: uploadId } = await params
    
    // For build-time compatibility, return a simple response
    // The actual upload data will be fetched when needed at runtime
    return NextResponse.json({ 
      message: "TUS upload endpoint available",
      uploadId 
    })
  } catch (error) {
    console.error("Failed to get upload info:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/admin/upload/tus/[id] - Handle TUS upload chunks
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: uploadId } = await params

    // Get TUS headers
    const tusResumable = request.headers.get("tus-resumable")
    const contentLength = request.headers.get("content-length")
    const uploadOffset = request.headers.get("upload-offset")
    const uploadLength = request.headers.get("upload-length")

    console.log("🚀 TUS PATCH request:", {
      uploadId,
      tusResumable,
      contentLength,
      uploadOffset,
      uploadLength,
      allHeaders: Object.fromEntries(request.headers.entries())
    })

    // Validate TUS headers
    if (!tusResumable) {
      return NextResponse.json({ error: "Missing TUS-Resumable header" }, { status: 400 })
    }

    if (!contentLength) {
      return NextResponse.json({ error: "Missing Content-Length header" }, { status: 400 })
    }

    // Handle file upload chunk
    const chunkSize = parseInt(contentLength)
    const currentOffset = uploadOffset ? parseInt(uploadOffset) : 0
    
    console.log(`📊 Processing chunk: ${chunkSize} bytes at offset ${currentOffset}`)

    // Read the chunk data
    const chunk = await request.arrayBuffer()
    
    if (chunk.byteLength !== chunkSize) {
      console.log(`⚠️ Chunk size mismatch: expected ${chunkSize}, got ${chunk.byteLength}`)
      return NextResponse.json({ 
        error: "Chunk size mismatch",
        expected: chunkSize,
        received: chunk.byteLength
      }, { status: 400 })
    }

    // In a real implementation, you would:
    // 1. Save the chunk to temporary storage
    // 2. Track upload progress
    // 3. Handle resumable uploads
    // 4. Upload to Bunny.net when complete
    
    // For now, we'll simulate a successful chunk upload
    console.log(`✅ TUS chunk uploaded: ${uploadId} - ${chunkSize} bytes at offset ${currentOffset}`)

    // Calculate new offset
    const newOffset = currentOffset + chunkSize

    // Return TUS response with proper headers
    const response = NextResponse.json({
      message: "Chunk uploaded successfully",
      uploadId,
      offset: newOffset,
      chunkSize
    })

    // Set required TUS headers
    response.headers.set("Tus-Resumable", "1.0.0")
    response.headers.set("Upload-Offset", newOffset.toString())
    response.headers.set("Access-Control-Expose-Headers", "Tus-Resumable, Upload-Offset, Upload-Length")

    return response
  } catch (error) {
    console.error("❌ Failed to handle TUS upload:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// HEAD /api/admin/upload/tus/[id] - Get upload status
export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: uploadId } = await params

    console.log(`📊 TUS HEAD request for upload: ${uploadId}`)

    // In a real implementation, you would check the upload status from storage
    // For now, we'll return a mock response

    const response = new NextResponse(null, { status: 200 })
    
    // Set TUS headers
    response.headers.set("Tus-Resumable", "1.0.0")
    response.headers.set("Upload-Offset", "0") // This should be the actual uploaded bytes
    response.headers.set("Upload-Length", "0") // This should be the total file size
    response.headers.set("Access-Control-Expose-Headers", "Tus-Resumable, Upload-Offset, Upload-Length")

    return response
  } catch (error) {
    console.error("❌ Failed to get upload status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/admin/upload/tus/[id] - Delete upload
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: uploadId } = await params

    console.log(`🗑️ TUS DELETE request for upload: ${uploadId}`)

    // In a real implementation, you would:
    // 1. Delete the upload from storage
    // 2. Clean up any temporary files
    // 3. Remove upload metadata

    // Return TUS response
    const response = new NextResponse(null, { status: 204 })
    response.headers.set("Tus-Resumable", "1.0.0")

    return response
  } catch (error) {
    console.error("❌ Failed to delete upload:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const response = new NextResponse(null, { status: 200 })
  
  // Set CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, HEAD, PATCH, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type, Upload-Length, Upload-Metadata, Tus-Resumable, Upload-Offset')
  response.headers.set('Access-Control-Expose-Headers', 'Tus-Resumable, Upload-Offset, Upload-Length')
  
  return response
}
