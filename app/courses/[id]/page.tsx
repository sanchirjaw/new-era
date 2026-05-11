"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Star, Users, Play, ChevronDown, ChevronRight, BookOpen, Clock, Lock } from "lucide-react"
import type { Course } from "@/lib/types"
import { CourseEnrollmentClient } from "./course-enrollment-client"
import { notFound } from "next/navigation"
import { getDisplayTitle, getDisplayDescription, getDisplayCategory } from "@/lib/course-utils"



import { useAuth } from "@/lib/hooks/useAuth"
import { useEffect, useState } from "react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface PageProps {
  params: Promise<{ id: string }>
}

export default function CoursePage({ params }: PageProps) {
  const { user, loading: authLoading } = useAuth()
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [openSubCourses, setOpenSubCourses] = useState<Set<string>>(new Set())
  const [realEnrollmentCount, setRealEnrollmentCount] = useState<number>(0)

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const resolvedParams = await params
        const { id } = resolvedParams

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
          (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://edunewera.mn')

        const response = await fetch(`${baseUrl}/api/courses/${id}`, {
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
          }
        })

        if (response.ok) {
          const courseData = await response.json()
          setCourse(courseData.course)

          // Fetch real enrollment count
          if (courseData.course?._id) {
            try {
              const enrollmentResponse = await fetch(`${baseUrl}/api/courses/${courseData.course._id}/enrollment-count`)
              if (enrollmentResponse.ok) {
                const enrollmentData = await enrollmentResponse.json()
                setRealEnrollmentCount(enrollmentData.enrollmentCount || 0)
              }
            } catch (enrollmentError) {
              console.error("Error fetching enrollment count:", enrollmentError)
              setRealEnrollmentCount(0)
            }
          }
        } else {
          setCourse(null)
        }
      } catch (error) {
        console.error("Error fetching course:", error)
        setCourse(null)
      } finally {
        setLoading(false)
      }
    }

    fetchCourse()
  }, [params])

  const toggleSubCourse = (subCourseId: string) => {
    const newOpenSubCourses = new Set(openSubCourses)
    if (newOpenSubCourses.has(subCourseId)) {
      newOpenSubCourses.delete(subCourseId)
    } else {
      newOpenSubCourses.add(subCourseId)
    }
    setOpenSubCourses(newOpenSubCourses)
  }

  const isEnrolled = course && user?.enrolledCourses?.includes(course._id || '')

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Ачааллаж байна...</div>
        </div>
      </div>
    )
  }

  if (!course) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Course Header */}
      <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-10 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <div className="mb-3">
              <Badge className="bg-[#5B7FFF] text-white mb-3">
                {getDisplayCategory(course.title)}
              </Badge>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              {getDisplayTitle(course.title)}
            </h1>
            <p className="text-base md:text-xl text-muted-foreground mb-6 max-w-3xl line-clamp-2 md:line-clamp-none">
              {getDisplayDescription(course.title, course.description)}
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground flex-wrap">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="font-medium">{course.rating || "4.8"} үнэлгээ</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>{course.enrolledCount || 0} суралцагч</span>
              </div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl font-black text-orange-500">₮{course.price?.toLocaleString() || "0"}</span>
                {course.originalPrice && course.originalPrice > course.price && (
                  <span className="text-lg text-muted-foreground line-through">₮{course.originalPrice.toLocaleString()}</span>
                )}
                {course.accessDurationMonths ? (
                  <span className="text-base text-muted-foreground">/ ({course.accessDurationMonths} сар)</span>
                ) : null}
              </div>
            </div>

            {/* Mobile-only CTA — shown below price on small screens */}
            <div className="mt-6 lg:hidden">
              {isEnrolled ? (
                <Link
                  href={`/courses/${course._id}/learn`}
                  className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-base transition-colors"
                >
                  <Play className="w-5 h-5" />
                  Хичээл үзэх
                </Link>
              ) : (
                <a
                  href="#enrollment"
                  className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-base transition-colors"
                >
                  Худалдаж авах — ₮{course.price?.toLocaleString() || "0"}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Course Content */}
      <section className="py-10 md:py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Course Description - Left Column */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-4">Хичээлийн агуулга</h3>
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {course.lessons && course.lessons.length > 0 ? (
                        isEnrolled ? (
                          // Interactive lesson list for enrolled users with sub-course grouping
                          <div className="space-y-4">
                            {course.subCourses && course.subCourses.length > 0 ? (
                              // Show lessons grouped by sub-courses
                              course.subCourses.map((subCourse) => {
                                const subCourseLessons = course.lessons?.filter(lesson => lesson.subCourseId === subCourse._id) || []
                                const isOpen = openSubCourses.has(subCourse._id || '')

                                return (
                                  <Collapsible key={subCourse._id} open={isOpen} onOpenChange={() => toggleSubCourse(subCourse._id || '')}>
                                    <CollapsibleTrigger className="w-full group">
                                      <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20 hover:bg-primary/10 hover:border-primary/30 transition-all duration-300 hover:shadow-sm">
                                        <div className="flex items-center gap-3">
                                          <BookOpen className="w-5 h-5 text-primary transition-transform duration-200 group-hover:scale-105" />
                                          <div className="text-left">
                                            <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors duration-200">{subCourse.title}</h4>
                                            <p className="text-sm text-muted-foreground">{subCourseLessons.length} хичээл</p>
                                          </div>
                                        </div>
                                        <div className="transition-transform duration-300 ease-in-out">
                                          {isOpen ? (
                                            <ChevronDown className="w-5 h-5 text-primary transform rotate-0" />
                                          ) : (
                                            <ChevronRight className="w-5 h-5 text-primary transform rotate-0" />
                                          )}
                                        </div>
                                      </div>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="overflow-hidden transition-all duration-500 ease-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2">
                                      <div className="space-y-2 mt-3 ml-4 animate-in slide-in-from-top-1 duration-300">
                                        {subCourseLessons
                                          .sort((a, b) => a.order - b.order)
                                          .map((lesson, index) => (
                                            <Link
                                              key={lesson._id}
                                              href={`/courses/${course._id}/learn?lesson=${lesson._id}`}
                                              className="block group/lesson"
                                              style={{
                                                animationDelay: `${index * 50}ms`,
                                                animationFillMode: 'both'
                                              }}
                                            >
                                              <div className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm transition-all duration-300 cursor-pointer transform hover:scale-[1.02] hover:translate-x-1">
                                                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center transition-all duration-200 group-hover/lesson:bg-primary/20 group-hover/lesson:scale-110">
                                                  <Play className="w-4 h-4 text-primary transition-transform duration-200 group-hover/lesson:scale-110" />
                                                </div>
                                                <div className="flex-1">
                                                  <h5 className="font-medium text-foreground group-hover/lesson:text-primary transition-colors duration-200">{lesson.order}. {lesson.title}</h5>
                                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                      <Clock className="w-3 h-3" />
                                                      <span>{lesson.duration} мин</span>
                                                    </div>
                                                    <span className="truncate">{lesson.description}</span>
                                                  </div>
                                                </div>
                                                {lesson.isPreview && (
                                                  <Badge variant="secondary" className="transition-transform duration-200 group-hover/lesson:scale-105">Үнэгүй</Badge>
                                                )}
                                              </div>
                                            </Link>
                                          ))}
                                      </div>
                                    </CollapsibleContent>
                                  </Collapsible>
                                )
                              })
                            ) : (
                              // Show lessons without sub-course grouping
                              course.lessons
                                .sort((a, b) => a.order - b.order)
                                .map((lesson, index) => (
                                  <Link
                                    key={lesson._id}
                                    href={`/courses/${course._id}/learn?lesson=${lesson._id}`}
                                    className="block group/lesson animate-in slide-in-from-left-2 duration-300"
                                    style={{
                                      animationDelay: `${index * 100}ms`,
                                      animationFillMode: 'both'
                                    }}
                                  >
                                    <div className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm transition-all duration-300 cursor-pointer transform hover:scale-[1.02] hover:translate-x-1">
                                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center transition-all duration-200 group-hover/lesson:bg-primary/20 group-hover/lesson:scale-110">
                                        <Play className="w-4 h-4 text-primary transition-transform duration-200 group-hover/lesson:scale-110" />
                                      </div>
                                      <div className="flex-1">
                                        <h4 className="font-medium text-foreground group-hover/lesson:text-primary transition-colors duration-200">{lesson.order}. {lesson.title}</h4>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                          <div className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            <span>{lesson.duration} мин</span>
                                          </div>
                                          <span className="truncate">{lesson.description}</span>
                                        </div>
                                      </div>
                                      {lesson.isPreview && (
                                        <Badge variant="secondary" className="transition-transform duration-200 group-hover/lesson:scale-105">Үнэгүй</Badge>
                                      )}
                                    </div>
                                  </Link>
                                ))
                            )}
                          </div>
                        ) : (
                          // Static syllabus for non-enrolled users — grouped by sub-course
                          course.subCourses && course.subCourses.length > 0 ? (
                            <div className="space-y-3">
                              {course.subCourses.map((subCourse, scIdx) => {
                                const subCourseLessons = (course.lessons || []).filter(
                                  l => l.subCourseId === subCourse._id || l.subCourseId === String(subCourse._id)
                                )
                                return (
                                  <div key={subCourse._id || scIdx} className="border rounded-lg overflow-hidden">
                                    {/* Sub-course header */}
                                    <div className="flex items-center gap-3 px-4 py-3 bg-muted/40">
                                      <BookOpen className="w-4 h-4 text-primary shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-foreground text-sm">{subCourse.title}</p>
                                        <p className="text-xs text-muted-foreground">{subCourseLessons.length} хичээл</p>
                                      </div>
                                    </div>
                                    {/* Lessons inside */}
                                    {subCourseLessons.length > 0 && (
                                      <div className="divide-y divide-border/50">
                                        {subCourseLessons
                                          .sort((a, b) => a.order - b.order)
                                          .map((lesson, lIdx) => (
                                            lesson.isPreview ? (
                                              <Link
                                                key={lesson._id || lIdx}
                                                href={`/courses/${course._id}/learn?lesson=${lesson._id}`}
                                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-primary/5 transition-colors group"
                                              >
                                                <Play className="w-3.5 h-3.5 text-primary shrink-0" />
                                                <span className="flex-1 text-sm text-foreground group-hover:text-primary transition-colors">{lesson.title}</span>
                                                <Badge variant="secondary" className="text-xs shrink-0">Үнэгүй</Badge>
                                              </Link>
                                            ) : (
                                              <div key={lesson._id || lIdx} className="flex items-center gap-3 px-4 py-2.5 opacity-60">
                                                <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                                <span className="flex-1 text-sm text-foreground">{lesson.title}</span>
                                              </div>
                                            )
                                          ))}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          ) : (
                            // Fallback: flat lesson list if no sub-courses
                            <div className="space-y-2">
                              {course.lessons.map((lesson, index) => (
                                <div key={lesson._id || index} className="flex items-center gap-3 p-3 rounded-lg border opacity-60">
                                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-medium text-primary">{index + 1}</span>
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-medium text-foreground">{lesson.title}</h4>
                                    <p className="text-sm text-muted-foreground">{lesson.description}</p>
                                  </div>
                                  {lesson.isPreview && (
                                    <Badge variant="secondary">Үнэгүй</Badge>
                                  )}
                                </div>
                              ))}
                            </div>
                          )
                        )
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>Хичээлийн агуулга удахгүй нэмэгдэх болно.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Course description — shown after content list */}
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-3">Хичээлийн тухай</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {course.description}
                </p>
              </div>
            </div>

            {/* Video Player & Enrollment - Right Column */}
            <div className="space-y-6">
              {/* Course Thumbnail/Video Player */}
              <div className="relative">
                {course.videoUrl ? (
                  <video
                    src={course.videoUrl}
                    className="w-full aspect-video bg-gray-900 rounded-lg"
                    controls
                  />
                ) : course.thumbnailUrl ? (
                  <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden">
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <Play className="w-24 h-24 text-white/80" />
                    </div>
                  </div>
                ) : (
                  <div className="w-full aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                    <Play className="w-24 h-24 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Enrollment Status */}
              <Card id="enrollment">
                <CardContent className="p-6">
                  <CourseEnrollmentClient course={course} />
                </CardContent>
              </Card>

              {/* Course Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Хичээлийн мэдээлэл</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Үнэлгээ</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="font-medium">{course.rating || "4.8"}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Суралцагчид</span>
                    <span className="font-medium">{course.enrolledCount || 0}</span>
                  </div>

                  <div className="flex justify-between items-baseline gap-2">
                    <span className="text-muted-foreground">Үнэ</span>
                    <div className="flex items-baseline gap-1.5 flex-wrap justify-end">
                      <span className="font-black text-orange-500">₮{course.price?.toLocaleString() || "0"}</span>
                      {course.originalPrice && course.originalPrice > course.price && (
                        <span className="text-sm text-muted-foreground line-through">₮{course.originalPrice.toLocaleString()}</span>
                      )}
                      {course.accessDurationMonths ? (
                        <span className="text-sm text-muted-foreground">/ ({course.accessDurationMonths} сар)</span>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}