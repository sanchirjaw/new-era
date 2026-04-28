import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    console.log("Testing database connection...")
    
    // Test basic database operations by calling a simple method
    const courses = await db.getAllCourses()
    console.log("Database connection successful, found courses:", courses.length)
    
    // Test lessons collection by trying to get all lessons
    const allLessons = await db.getAllLessons()
    console.log("Lessons collection accessible, count:", allLessons.length)
    
    // Test subcourses
    try {
      // Check if there are any subcourses by looking at the first course
      if (courses.length > 0) {
        const firstCourse = courses[0] as any
        console.log("First course structure:", {
          id: firstCourse._id,
          title: firstCourse.title,
          hasSubCourses: !!firstCourse.subCourses,
          subCoursesCount: firstCourse.subCourses?.length || 0,
          hasLessons: !!firstCourse.lessons,
          lessonsCount: firstCourse.lessons?.length || 0
        })
      }
      
      return NextResponse.json({ 
        success: true, 
        message: "Database connection test successful",
        coursesCount: courses.length,
        lessonsCount: allLessons.length,
        firstCourseInfo: courses.length > 0 ? {
          hasSubCourses: !!(courses[0] as any).subCourses,
          subCoursesCount: (courses[0] as any).subCourses?.length || 0,
          hasLessons: !!(courses[0] as any).lessons,
          lessonsCount: (courses[0] as any).lessons?.length || 0
        } : null
      })
    } catch (error) {
      console.error("Error checking course structure:", error)
      return NextResponse.json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 })
    }
  } catch (error) {
    console.error("Database connection test failed:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
