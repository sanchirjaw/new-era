import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/database"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const db = await connectDB()
    const dbName = db.databaseName
    const MONGODB_DB = process.env.MONGODB_DB || "(not set)"

    const count = await db.collection("sub_courses").countDocuments()
    const samples = await db.collection("sub_courses").find({}).limit(5).toArray()

    // Also check what URI is being used (mask password)
    const uri = (process.env.MONGODB_URI || process.env.MONGODB_URL || "local").replace(/:([^@]+)@/, ":***@")

    return NextResponse.json({
      dbName,
      MONGODB_DB,
      uri,
      subCourseCount: count,
      samples: samples.map(s => ({
        id: s._id.toString(),
        idConstructor: s._id?.constructor?.name ?? typeof s._id,
        title: s.title
      }))
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
