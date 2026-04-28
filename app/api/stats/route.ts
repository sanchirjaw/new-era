import { NextResponse } from "next/server"
import { Database } from "@/lib/database"

export async function GET() {
  try {
    const db = Database.getInstance()
    
    // Try to get custom stats from platform settings first
    const settings = await db.getPlatformSettings()
    
    if (settings.stats) {
      return NextResponse.json(settings.stats)
    }
    
    // Fallback to document counts and format them to match expected structure
    const statsData = await db.getStats()
    
    const stats = {
      totalStudents: (statsData.userCount || 0).toString() + "+",
      averageRating: "4.8/5",
      completedLessons: (statsData.enrollmentCount || 0).toString() + "+"
    }
    
    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching stats:", error)
    // Return fallback stats if everything fails
    return NextResponse.json({
      totalStudents: "100+",
      averageRating: "4.8/5",
      completedLessons: "15,000+"
    })
  }
}
