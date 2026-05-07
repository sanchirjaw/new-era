import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-server"
import { db } from "@/lib/database"

// POST /api/admin/fix-lesson-orders - Fix lesson AND subcourse orders
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("admin-token")?.value
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = verifyToken(token)
    if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    let totalFixed = 0

    // ── Fix subcourse orders per course ──────────────────────────────────
    const allSubCourses = await db.getAllSubCourses()
    const byCourse: Record<string, typeof allSubCourses> = {}
    for (const sc of allSubCourses) {
      const cid = sc.courseId?.toString() || "unknown"
      if (!byCourse[cid]) byCourse[cid] = []
      byCourse[cid].push(sc)
    }
    for (const scs of Object.values(byCourse)) {
      const sorted = scs.sort((a, b) =>
        new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
      )
      for (let i = 0; i < sorted.length; i++) {
        const sc = sorted[i]
        if (sc.order !== i + 1) {
          await db.updateSubCourse(sc._id, { order: i + 1 })
          totalFixed++
        }
      }
    }

    // ── Fix lesson orders per subcourse ──────────────────────────────────
    for (const subCourse of allSubCourses) {
      const lessons = await db.getLessonsBySubCourseId(subCourse._id)
      if (lessons.length === 0) continue
      const sorted = lessons.sort((a, b) =>
        new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
      )
      for (let i = 0; i < sorted.length; i++) {
        const lesson = sorted[i]
        if (lesson.order !== i + 1) {
          await db.updateLesson(lesson._id, { order: i + 1 })
          totalFixed++
        }
      }
    }

    return NextResponse.json({
      message: `Fixed ${totalFixed} orders (subcourses + lessons)`,
      totalFixed,
    })
  } catch (error) {
    console.error("Error fixing orders:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
