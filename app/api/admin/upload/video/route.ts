import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-server"
import { bunnyVideoService } from "@/lib/bunny-video"
import { auth } from "@/auth"

export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    console.log('🎥 Video upload request received')
    
    // Check for NextAuth session first, then admin token
    const session = await auth()
    let user = null

    if (session?.user) {
      // NextAuth user - get full user data from database
      const { db } = await import("@/lib/database")
      const dbUser = await db.getUserByEmail(session.user.email!)
      if (dbUser && dbUser._id && dbUser.role === "admin") {
        user = { id: dbUser._id.toString(), role: dbUser.role }
        console.log('✅ NextAuth admin user authenticated:', dbUser.email)
      }
    } else {
      // Admin token
      const token = request.cookies.get("admin-token")?.value
      if (token) {
        user = verifyToken(token)
        console.log('✅ Admin token user authenticated:', user?.role)
      }
    }

    if (!user || user.role !== "admin") {
      console.log('❌ Unauthorized access attempt')
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check content type to determine if this is a direct upload request
    const contentType = request.headers.get('content-type') || ''
    
    if (contentType.includes('application/json')) {
      // Direct upload request - generate upload URL for Bunny.net
      console.log('🚀 Processing direct upload request')
      
      const body = await request.json()
      const { filename, fileSize, contentType: fileContentType } = body

      if (!filename || !fileSize || !fileContentType) {
        console.log('❌ Missing required fields for direct upload:', { 
          filename: !!filename, 
          fileSize: !!fileSize, 
          contentType: !!fileContentType 
        })
        return NextResponse.json({ 
          error: "Missing required fields for direct upload",
          details: { 
            filename: !!filename, 
            fileSize: !!fileSize, 
            contentType: !!fileContentType 
          }
        }, { status: 400 })
      }

      // Log file size for debugging
      const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2)
      console.log(`📊 Direct upload request for: ${filename}`)
      console.log(`📊 File size: ${fileSizeMB} MB (${fileSize} bytes)`)
      console.log(`📋 File type: ${fileContentType}`)

      console.log('🚀 Generating direct upload URL for Bunny.net...')

      // Generate direct upload URL
      const directUpload = await bunnyVideoService.getDirectUploadUrl({
        filename,
        fileSize,
        contentType: fileContentType
      })

      if (!directUpload.success || !directUpload.uploadUrl || !directUpload.videoId) {
        console.log('❌ Failed to generate direct upload URL:', directUpload.error)
        return NextResponse.json({ 
          error: directUpload.error || "Failed to generate upload URL" 
        }, { status: 500 })
      }

      console.log('✅ Direct upload URL generated successfully:', directUpload.videoId)

      return NextResponse.json({ 
        success: true,
        uploadUrl: directUpload.uploadUrl,
        videoId: directUpload.videoId,
        headers: directUpload.headers,
        message: "Upload directly to Bunny.net using the provided URL and headers"
      })

    } else if (contentType.includes('multipart/form-data')) {
      // Legacy file upload (for small files under Vercel limits)
      console.log('📁 Processing legacy file upload (small files only)')
      
      const formData = await request.formData()
      const videoFile = formData.get("videoFile") as File
      const title = formData.get("title") as string
      const description = formData.get("description") as string

      console.log('📁 Form data received:', {
        hasVideoFile: !!videoFile,
        title,
        description,
        fileSize: videoFile?.size,
        fileType: videoFile?.type
      })

      if (!videoFile || !title || !description) {
        console.log('❌ Missing required fields:', { 
          videoFile: !!videoFile, 
          title: !!title, 
          description: !!description 
        })
        return NextResponse.json({ 
          error: "Missing required fields",
          details: { 
            videoFile: !!videoFile, 
            title: !!title, 
            description: !!description 
          }
        }, { status: 400 })
      }

      // Check file size - warn if it's too large for Vercel
      const fileSizeMB = (videoFile.size / (1024 * 1024)).toFixed(2)
      console.log(`📊 File size: ${fileSizeMB} MB (${videoFile.size} bytes)`)
      console.log(`📋 File type: ${videoFile.type}`)

      if (videoFile.size > 4.5 * 1024 * 1024) { // 4.5MB Vercel limit
        console.log('⚠️ File too large for Vercel - recommend using direct upload')
        return NextResponse.json({ 
          error: "File too large for direct upload. Use the direct upload method instead.",
          details: "Files larger than 4.5MB cannot be uploaded through Vercel. Use the direct upload to Bunny.net method.",
          maxSize: "4.5MB",
          recommendedMethod: "direct-upload"
        }, { status: 413 })
      }

      // Test Bunny.net connection first
      console.log('🔗 Testing Bunny.net connection...')
      const connectionTest = await bunnyVideoService.testConnection()
      
      if (!connectionTest) {
        console.log('❌ Bunny.net connection test failed')
        return NextResponse.json({ 
          error: "Bunny.net service unavailable. Please check your configuration." 
        }, { status: 503 })
      }

      console.log('🚀 Starting video upload to Bunny.net...')

      const upload = await bunnyVideoService.uploadVideo(videoFile, {
        title,
        description,
        tags: [],
        category: "education"
      })

      console.log('📤 Upload result:', upload)

      if (!upload.success || !upload.videoId || !upload.videoUrl) {
        console.log('❌ Upload failed:', upload.error)
        return NextResponse.json({ 
          error: upload.error || "Upload failed" 
        }, { status: 500 })
      }

      console.log('✅ Video upload successful:', upload.videoId)

      return NextResponse.json({ 
        success: true,
        videoId: upload.videoId,
        videoUrl: upload.videoUrl
      })
    } else {
      return NextResponse.json({ 
        error: "Unsupported content type. Use application/json for direct upload or multipart/form-data for file upload." 
      }, { status: 400 })
    }
  } catch (error) {
    console.error("❌ Video upload error:", error)
    
    // Check if it's a file size error
    if (error instanceof Error && error.message.includes('413')) {
      return NextResponse.json({ 
        error: "File too large. Please check your server configuration for file size limits.",
        details: "The server is rejecting files larger than the configured limit. Contact your hosting provider to increase the limit."
      }, { status: 413 })
    }
    
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    }, { status: 500 })
  }
}
