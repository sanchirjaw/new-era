import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { db } from "@/lib/database"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    const course = await db.getCourseById(new ObjectId(id))
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    // Fetch sub-courses for this course
    console.log("Looking for subcourses with courseId:", id)
    const subCourses = await db.getSubCoursesByCourseId(new ObjectId(id))
    console.log("Fetched subcourses:", subCourses)

    // Fetch lessons for all sub-courses
    let allLessons: any[] = []
    if (subCourses && subCourses.length > 0) {
      for (const subCourse of subCourses) {
        const lessons = await db.getLessonsBySubCourseId(new ObjectId(subCourse._id))
        console.log(`Lessons for subcourse ${subCourse._id}:`, lessons)
        if (lessons && lessons.length > 0) {
          allLessons.push(...lessons)
        }
      }
    }
    
    // Also fetch any lessons that might be directly linked to the course
    const directLessons = await db.getLessonsByCourseId(new ObjectId(id))
    if (directLessons && directLessons.length > 0) {
      allLessons.push(...directLessons)
    }
    
    console.log("Total lessons found:", allLessons.length)
    console.log("All lessons:", allLessons)
    
    // Combine course with lessons and subcourses
    const courseWithLessons = {
      ...course,
      lessons: allLessons || [],
      subCourses: subCourses || []
    }

    return NextResponse.json({ course: courseWithLessons })
  } catch (error) {
    
    return NextResponse.json({ error: "Failed to fetch course" }, { status: 500 })
  }
}
