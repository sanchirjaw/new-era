import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { verifyToken } from "@/lib/auth-server"
import { db } from "@/lib/database"
import { ObjectId } from "mongodb"

// GET /api/auth/my-courses - Get courses user has access to with progress
export async function GET(request: NextRequest) {
  try {
    let userId: string | null = null
    let userEmail: string | null = null

    // Try NextAuth session first
    try {
      const session = await auth()
      if (session?.user?.email) {
        userEmail = session.user.email
        userId = session.user.id
      }
    } catch (error) {
      // NextAuth session check failed, trying custom auth
    }
    
    if (userEmail) {
      const user = await db.getUserByEmail(userEmail)
      
      if (user && user.enrolledCourses && user.enrolledCourses.length > 0) {
        const courses = []
        
        for (const courseId of user.enrolledCourses) {
          // Use getCourseWithLessons like the stats API does
          const courseObjectId = typeof courseId === 'string' ? new ObjectId(courseId) : courseId
          const course = await db.getCourseWithLessons(courseObjectId)
          
          if (course && course.isActive) {
            // Get user progress for this course
            let progress = 0
            let completedLessons = 0
            
            try {
              if (!user._id) continue
              const courseObjectId = typeof courseId === 'string' ? new ObjectId(courseId) : courseId
              const userObjectId = typeof user._id === 'string' ? new ObjectId(user._id) : user._id
              const userProgress = await db.getUserProgress(userObjectId, courseObjectId)
              progress = userProgress.progress || 0
              completedLessons = userProgress.completedLessons?.length || 0
            } catch (error) {
              // Handle progress fetch error silently
            }
            
            courses.push({
              ...course,
              progress,
              completedLessons
            })
          }
        }
        
        return NextResponse.json({ courses })
      }
      
      return NextResponse.json({ courses: [] })
    }
    
    // Fallback to custom auth
    const token = request.cookies.get("auth-token")?.value
    
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    userId = user.id
    const userData = await db.getUserById(new ObjectId(userId))
       
    if (!userData || !userData.enrolledCourses || userData.enrolledCourses.length === 0) {
      return NextResponse.json({ courses: [] })
    }

    const courses = []
    
    for (const courseId of userData.enrolledCourses) {
      // Use getCourseWithLessons like the stats API does
      const courseObjectId = typeof courseId === 'string' ? new ObjectId(courseId) : courseId
      const course = await db.getCourseWithLessons(courseObjectId)
     
      
      if (course && course.isActive) {
        // Get user progress for this course
        let progress = 0
        let completedLessons = 0
        
        try {
          const courseObjectId = typeof courseId === 'string' ? new ObjectId(courseId) : courseId
          const userObjectId = typeof userId === 'string' ? new ObjectId(userId) : userId
          const userProgress = await db.getUserProgress(userObjectId, courseObjectId)
          progress = userProgress.progress || 0
          completedLessons = userProgress.completedLessons?.length || 0
        } catch (error) {
          // Handle progress fetch error silently
        }
        
        courses.push({
          ...course,
          progress,
          completedLessons
        })
      }
    }
    
    return NextResponse.json({ courses })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 })
  }
}
