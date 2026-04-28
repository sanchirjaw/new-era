import { NextRequest, NextResponse } from "next/server"
import { Database } from "@/lib/database"

// GET /api/media-grid - Get public media grid layout
export async function GET(request: NextRequest) {
  try {
    // Get grid layout
    const db = Database.getInstance()
    const layout = await db.getMediaGridLayout()
    
    // Only return if published
    if (!layout || !layout.isPublished) {
      return NextResponse.json({ layout: null })
    }
    
    return NextResponse.json({ layout })
  } catch (error) {
    console.error("Error fetching public media grid:", error)
    return NextResponse.json({ layout: null })
  }
}
