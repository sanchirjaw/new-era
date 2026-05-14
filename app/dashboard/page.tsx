"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Header } from "@/components/header"
import { BookOpen, Play } from "lucide-react"
import type { Course } from "@/lib/types"
import { useAuth } from "@/lib/hooks/useAuth"
import { useRouter } from "next/navigation"
import { CourseCard } from "@/components/course/CourseCard"

interface CourseWithProgress extends Course {
  progress?: number
  completedLessons?: number
  enrollmentId?: string
  expiresAt?: string | null
}

interface Stats {
  enrolledCourses: number
  completedLessons: number
  totalProgress: number
  averageProgress: number
}

export default function DashboardPage() {
  const { refreshUser } = useAuth()
  const [courses, setCourses] = useState<CourseWithProgress[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()


  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        
        // Check authentication
        const authCheck = await fetch('/api/auth/me')
        
        if (!authCheck.ok) {
          router.push('/login')
          return
        }

        // Fetch user-specific courses and stats in parallel
        const [coursesRes, statsRes] = await Promise.all([
          fetch('/api/auth/my-courses'),
          fetch('/api/auth/my-stats')
        ])

        if (coursesRes.ok && statsRes.ok) {
          const [coursesData, statsData] = await Promise.all([
            coursesRes.json(),
            statsRes.json()
          ])

          console.log("Dashboard courses data:", coursesData)
          console.log("Dashboard stats data:", statsData)

          setCourses(coursesData.courses || [])
          setStats(statsData.stats)
        }
      } catch (error) {
        console.error("Dashboard fetch error:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [router])

  // Refresh dashboard data when page becomes visible (e.g., returning from learn page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible, refresh data
        const fetchDashboardData = async () => {
          try {
            const [coursesRes, statsRes] = await Promise.all([
              fetch('/api/auth/my-courses'),
              fetch('/api/auth/my-stats')
            ])

            if (coursesRes.ok && statsRes.ok) {
              const [coursesData, statsData] = await Promise.all([
                coursesRes.json(),
                statsRes.json()
              ])

              setCourses(coursesData.courses || [])
              setStats(statsData.stats)
            }
          } catch (error) {
            console.error("Dashboard refresh error:", error)
          }
        }
        fetchDashboardData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])



  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Ачааллаж байна...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1
            className="text-3xl font-black bg-clip-text text-transparent mb-2"
            style={{ backgroundImage: "linear-gradient(135deg, #00E5A0 0%, #7B61FF 100%)" }}
          >
            Хяналтын самбар
          </h1>
          <p className="text-muted-foreground">Тавтай морилно уу! Таны суралцахуйн явц энд байна.</p>


        </div>





        {/* My Courses */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-6">
            <h2 className="text-2xl font-bold text-foreground">Миний элссэн хичээлүүд ({stats?.enrolledCourses || 0})</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  setLoading(true)
                  const [coursesRes, statsRes] = await Promise.all([
                    fetch('/api/auth/my-courses'),
                    fetch('/api/auth/my-stats')
                  ])

                  if (coursesRes.ok && statsRes.ok) {
                    const [coursesData, statsData] = await Promise.all([
                      coursesRes.json(),
                      statsRes.json()
                    ])

                    setCourses(coursesData.courses || [])
                    setStats(statsData.stats)
                  }
                } catch (error) {
                  console.error("Manual refresh error:", error)
                } finally {
                  setLoading(false)
                }
              }}
            >
              🔄 Шинэчлэх
            </Button>
          </div>
          




          {courses.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <CourseCard
                  key={course._id}
                  id={course._id?.toString() || ''}
                  title={course.title}
                  description={course.description}
                  thumbnailUrl={course.thumbnailUrl}
                  rating={course.rating}
                  studentsCount={course.enrolledCount}
                  isEnrolled={true}
                  expiresAt={course.expiresAt}
                  progressPct={course.progress || 0}
                  teacherBadge={course.category}
                  onOpen={(id) => router.push(`/courses/${id}`)}
                  onContinue={(id) => router.push(`/courses/${id}/learn`)}
                />
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Одоогоор элссэн хичээл байхгүй</h3>
                <p className="text-muted-foreground mb-4">Хичээлд элсэж суралцахын аялалаа эхлүүлнэ үү.</p>
                <Button asChild className="bg-[#5B7FFF] hover:bg-[#4A6FE7]">
                  <Link href="/courses">Боломжтой хичээлүүдийг үзэх</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
