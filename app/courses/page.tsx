"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Filter } from "lucide-react"
import type { Course } from "@/lib/types"
import { getDisplayTitle, getDisplayDescription } from "@/lib/course-utils"
import { useAuth } from "@/lib/hooks/useAuth"
import { useEffect, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CourseCard } from "@/components/course/CourseCard"
import { CourseCardSkeleton } from "@/components/course/CourseCard.skeleton"

interface CourseWithProgress extends Course {
  progress?: number
  completedLessons?: number
  enrollmentId?: string
}

type SortOption = "all" | "enrolled" | "not-enrolled"

export default function CoursesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [sortOption, setSortOption] = useState<SortOption>("all")

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setDataLoading(true)

        // Always show all available courses on the main courses page
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
          (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://edunewera.mn')

        const response = await fetch(`${baseUrl}/api/courses`)
        if (response.ok) {
          const data = await response.json()
          setAllCourses(data.courses || [])
        }
      } catch (error) {
        console.error("Error fetching courses:", error)
      } finally {
        setDataLoading(false)
      }
    }

    if (!loading) {
      fetchCourses()
    }
  }, [loading])

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Ачааллаж байна...</div>
        </div>
      </div>
    )
  }

  // Helper function to check if user is enrolled in a specific course
  const isUserEnrolledInCourse = (courseId: string) => {
    return user?.enrolledCourses?.includes(courseId) || false
  }

  // Filter courses based on sort option
  const displayCourses = allCourses.filter(course => {
    if (!user) return true // Show all courses if user is not logged in

    switch (sortOption) {
      case "enrolled":
        return isUserEnrolledInCourse(course._id || '')
      case "not-enrolled":
        return !isUserEnrolledInCourse(course._id || '')
      case "all":
      default:
        return true
    }
  })

  // Handler functions for course actions
  const handleCourseOpen = (courseId: string) => {
    router.push(`/courses/${courseId}`)
  }

  const handleCourseBuy = (courseId: string) => {
    if (!user) {
      router.push('/register')
      return
    }
    router.push(`/courses/${courseId}`)
  }

  const handleCourseContinue = (courseId: string) => {
    router.push(`/courses/${courseId}/learn`)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center space-y-6">
          <h1 className="text-5xl lg:text-6xl font-bold text-foreground">
            Бүх хичээлүүд
          </h1>
        </div>
      </section>

      {/* Sorting Controls */}
      {user && (
        <section className="container mx-auto px-4 pb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Filter className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Хичээл шүүх:</span>
              <Select value={sortOption} onValueChange={(value: SortOption) => setSortOption(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Хичээл сонгох" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Бүх хичээлүүд</SelectItem>
                  <SelectItem value="enrolled">Миний худалдаж авсан</SelectItem>
                  <SelectItem value="not-enrolled">Худалдаж аваагүй</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              {displayCourses.length} хичээл олдлоо
            </div>
          </div>
        </section>
      )}

      {/* Courses Grid */}
      <section className="container mx-auto px-4 pb-20">
        {dataLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              
              <CourseCardSkeleton key={index} />
            ))}
          </div>
        ) : displayCourses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayCourses.map((course) => (
              <CourseCard
                key={course._id}
                id={course._id || ''}
                title={getDisplayTitle(course.title)}
                description={getDisplayDescription(course.title, course.description)}
                thumbnailUrl={course.thumbnailUrl}
                rating={course.rating}
                studentsCount={course.enrolledCount}
                priceMnt={course.price}
                isEnrolled={isUserEnrolledInCourse(course._id || '')}
                progressPct={0} // TODO: Add progress tracking
                teacherBadge={course.category}
                onOpen={handleCourseOpen}
                onBuy={handleCourseBuy}
                onContinue={handleCourseContinue}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-2xl font-bold text-foreground mb-2">Хичээл олдсонгүй</h3>
            <p className="text-muted-foreground mb-6">Одоогоор бүртгэгдсэн хичээл байхгүй байна.</p>
            <Button asChild className="bg-[#5B7FFF] hover:bg-[#4A6FE7]">
              <Link href="/">Нүүр хуудас руу буцах</Link>
            </Button>
          </div>
        )}
      </section>

      <Footer />
    </div>
  )
}