import { NextResponse } from "next/server"
import { db } from "@/lib/database"

export async function GET() {
  try {
    const settings = await db.getPlatformSettings()

    return NextResponse.json({
      settings: {
        freePreviewMinutes: Number(settings.freePreviewMinutes) || 0,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
