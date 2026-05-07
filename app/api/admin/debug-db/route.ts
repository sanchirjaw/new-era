import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-server"
import { connectDB } from "@/lib/database"
import clientPromise from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("admin-token")?.value
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const user = verifyToken(token)
    if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const client = await clientPromise

    // List all databases
    const adminDb = client.db("admin")
    const dbList = await adminDb.admin().listDatabases()
    const dbNames = dbList.databases.map((d: any) => d.name)

    // Check both possible DB names
    const results: any = { databases: dbNames, collections: {} }

    for (const dbName of ["new-era-platform", "newera_prod"]) {
      const db = client.db(dbName)
      const collections = await db.listCollections().toArray()
      const colNames = collections.map((c: any) => c.name)
      results.collections[dbName] = {}

      for (const col of ["sub_courses", "subCourses", "courses", "lessons", "users", "payments"]) {
        if (colNames.includes(col)) {
          const count = await db.collection(col).countDocuments()
          const sample = await db.collection(col).findOne()
          results.collections[dbName][col] = {
            count,
            sampleId: sample?._id?.toString(),
            sampleIdType: sample?._id?.constructor?.name,
          }
        }
      }
    }

    return NextResponse.json(results)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
