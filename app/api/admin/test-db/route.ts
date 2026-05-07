import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-server"
import clientPromise from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("admin-token")?.value
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const user = verifyToken(token)
    if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const client = await clientPromise
    const result: any = {
      MONGODB_DB_ENV: process.env.MONGODB_DB || "(not set)",
      NODE_ENV: process.env.NODE_ENV,
      databases: {}
    }

    for (const dbName of ["new-era-platform", "newera_prod"]) {
      const db = client.db(dbName)
      const sc = await db.collection("sub_courses").countDocuments()
      const co = await db.collection("courses").countDocuments()
      const us = await db.collection("users").countDocuments()
      const sample = await db.collection("sub_courses").findOne({})
      result.databases[dbName] = {
        sub_courses: sc,
        courses: co,
        users: us,
        sampleId: sample?._id?.toString() || null,
      }
    }

    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
