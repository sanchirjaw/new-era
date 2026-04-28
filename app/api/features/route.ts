import { NextResponse } from "next/server"
import { Database } from "@/lib/database"

export async function GET() {
  try {
    const db = Database.getInstance()
    const settings = await db.getPlatformSettings()
    return NextResponse.json({ features: settings.features || null })
  } catch (error) {
    console.error("Error fetching features:", error)
    return NextResponse.json({ features: null })
  }
}
