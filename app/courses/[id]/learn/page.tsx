"use client"

import { useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
const MarkdownPreview = dynamic(() => import("@uiw/react-markdown-preview"), { ssr: false })
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Play, Clock, BookOpen, ChevronLeft, Check, Lock,
  Video, UserPlus, ShoppingCart, ChevronDown, ChevronRight, Menu, X, Sun, Moon
} from "lucide-react"
import { useAuth } from "@/lib/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"
import type { Course, Lesson } from "@/lib/types"
import Link from "next/link"
import { PaymentModal } from "@/components/payment-modal"

interface EnrolledCourse {
  courseId: string
  enrolledAt: string
  isActive: boolean
}

export default function LearnPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading, refreshUser } = useAuth()
  const { toast } = useToast()
  const [course, setCourse] = useState<Course | null>(null)
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([])
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [subCourses, setSubCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set())
  const [freePreviewMinutes, setFreePreviewMinutes] = useState(0)
  const [previewSecondsWatched, setPreviewSecondsWatched] = useState(0)
  const [previewExpired, setPreviewExpired] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isDark, setIsDark] = useState(true)
  const [videoReady, setVideoReady] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const courseResponse = await fetch(`/api/courses/${params.id}`)
        if (!courseResponse.ok) throw new Error("Failed to fetch course")
        const courseData = await courseResponse.json()
        const targetCourse = courseData.course as Course | null
        if (!targetCourse) throw new Error("Course not found")

        setCourse(targetCourse)

        try {
          const settingsResponse = await fetch("/api/settings", { cache: "no-store" })
          if (settingsResponse.ok) {
            const settingsData = await settingsResponse.json()
            setFreePreviewMinutes(Number(settingsData.settings?.freePreviewMinutes) || 0)
          }
        } catch {}

        if (user) {
          const courseId = params.id as string
          if (user.enrolledCourses?.includes(courseId)) {
            setEnrolledCourses([{ courseId, enrolledAt: new Date().toISOString(), isActive: true }])
          }
        }

        if (targetCourse.subCourses && targetCourse.subCourses.length > 0) {
          setSubCourses(targetCourse.subCourses)
          // Expand all sections by default
          setExpandedSections(new Set(targetCourse.subCourses.map((sc: any) => sc._id)))
        }

        const lessonParam = searchParams.get('lesson')
        if (lessonParam && targetCourse.lessons) {
          const specific = targetCourse.lessons.find((l: Lesson) => l._id === lessonParam)
          setSelectedLesson(specific || targetCourse.lessons[0] || null)
        } else if (targetCourse.lessons?.length > 0) {
          setSelectedLesson(targetCourse.lessons[0])
        }

        if (user && targetCourse._id) {
          try {
            const progressResponse = await fetch(`/api/auth/progress?courseId=${targetCourse._id}`, { credentials: 'include' })
            if (progressResponse.ok) {
              const progressData = await progressResponse.json()
              if (progressData.completedLessons) setCompletedLessons(new Set(progressData.completedLessons))
            }
          } catch {}
        }
      } catch (error) {
        console.error("Error fetching course data:", error)
        router.push("/courses")
      } finally {
        setLoading(false)
      }
    }

    if (params.id && !authLoading) fetchData()
  }, [params.id, user, authLoading, router, searchParams])

  useEffect(() => {
    if (user && !authLoading) refreshUser()
  }, [user?.id, authLoading])

  const hasAccess = (courseId: string) => {
    if (user?.role === 'admin') return true
    return user?.enrolledCourses?.includes(courseId) || false
  }

  const previewLimitSeconds = useMemo(() => Math.max(0, freePreviewMinutes * 60), [freePreviewMinutes])
  const userHasAccess = hasAccess(course?._id || '')
  const canUseFreePreview = !!user && !userHasAccess && previewLimitSeconds > 0
  const remainingPreviewSeconds = Math.max(0, previewLimitSeconds - previewSecondsWatched)
  const shouldShowVideo = !!selectedLesson?.videoUrl && (userHasAccess || (canUseFreePreview && !previewExpired))

  useEffect(() => { setPreviewSecondsWatched(0); setPreviewExpired(false) }, [course?._id])
  useEffect(() => { setVideoReady(false) }, [selectedLesson?._id])

  useEffect(() => {
    if (!canUseFreePreview || previewExpired || !selectedLesson?.videoUrl) return
    const timer = window.setInterval(() => {
      setPreviewSecondsWatched((current) => {
        const next = current + 1
        if (next >= previewLimitSeconds) {
          window.clearInterval(timer)
          setPreviewExpired(true)
          setShowPaymentModal(true)
          return previewLimitSeconds
        }
        return next
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [canUseFreePreview, previewExpired, previewLimitSeconds, selectedLesson?.videoUrl])

  const handleMarkAsDone = async (lessonId: string) => {
    try {
      const response = await fetch('/api/auth/progress/mark-complete', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, courseId: course?._id })
      })
      if (response.ok) {
        setCompletedLessons(prev => new Set([...prev, lessonId]))
        toast({ title: "✓ Дууслаа гэж тэмдэглэлээ" })
      }
    } catch {}
  }

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      next.has(sectionId) ? next.delete(sectionId) : next.add(sectionId)
      return next
    })
  }

  // Progress calculation
  const totalLessons = course?.lessons?.length || 0
  const completedCount = completedLessons.size
  const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

  if (authLoading || loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-3 text-white">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-zinc-400">Ачааллаж байна...</p>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-950 text-white">
        <p>Хичээл олдсонгүй</p>
      </div>
    )
  }

  if (!userHasAccess && !canUseFreePreview) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-6 ${isDark ? 'bg-zinc-950' : 'bg-zinc-100'}`}>
        <div className="text-center max-w-sm text-white">
          <div className="text-6xl mb-6">{user ? '💳' : '🔐'}</div>
          <h1 className="text-2xl font-bold mb-3">{user ? 'Хандах эрх байхгүй' : 'Нэвтрэх шаардлагатай'}</h1>
          <p className="text-zinc-400 mb-6 text-sm">{user ? 'Энэ хичээлийг худалдаж авна уу' : 'Хичээлийг үзэхийн тулд нэвтэрнэ үү'}</p>
          <div className="space-y-2">
            {!user ? (
              <>
                <Button asChild className="w-full"><Link href="/register"><UserPlus className="w-4 h-4 mr-2" />Бүртгүүлэх</Link></Button>
                <Button asChild variant="outline" className="w-full border-zinc-700 text-white hover:bg-zinc-800"><Link href="/login">Нэвтрэх</Link></Button>
              </>
            ) : (
              <Button className="w-full bg-orange-600 hover:bg-orange-700">
                <ShoppingCart className="w-4 h-4 mr-2" />
                {course.price ? `Сургалтад элсэх — ₮${course.price.toLocaleString()}` : 'Сургалтад элсэх'}
              </Button>
            )}
            <Button asChild variant="ghost" className="w-full text-zinc-400 hover:text-white">
              <Link href={`/courses/${course._id}`}><ChevronLeft className="w-4 h-4 mr-1" />Буцах</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`h-screen flex overflow-hidden ${isDark ? 'dark' : ''}`}>
    <div className="h-screen flex overflow-hidden w-full bg-white dark:bg-zinc-950">

      {/* ── LEFT SIDEBAR ── */}
      <aside className={`${sidebarOpen ? 'w-72' : 'w-0'} shrink-0 flex flex-col h-screen transition-all duration-300 overflow-hidden ${isDark ? 'bg-zinc-900 text-white' : 'bg-zinc-50 text-zinc-900 border-r border-zinc-200'}`}>
        {/* Course header */}
        <div className={`p-4 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <Link
            href={`/courses/${course._id}`}
            className={`flex items-center gap-1.5 text-xs mb-3 transition-colors ${isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'}`}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Хичээл рүү буцах
          </Link>
          <h2 className={`text-sm font-semibold leading-snug line-clamp-2 ${isDark ? 'text-white' : 'text-zinc-900'}`}>{course.title}</h2>

          {/* Progress bar */}
          <div className="mt-3">
            <div className={`flex justify-between text-xs mb-1.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              <span>Явц</span>
              <span className={`font-medium ${isDark ? 'text-white' : 'text-zinc-900'}`}>{progressPct}%</span>
            </div>
            <div className={`w-full rounded-full h-1.5 ${isDark ? 'bg-zinc-700' : 'bg-zinc-200'}`}>
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className={`text-xs mt-1 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>{completedCount}/{totalLessons} хичээл</p>
          </div>
        </div>

        {/* Lessons list */}
        <div className="flex-1 overflow-y-auto py-2">
          {subCourses.map((subCourse) => {
            const sectionLessons = (course.lessons || [])
              .filter(l => l.subCourseId === subCourse._id)
              .sort((a, b) => a.order - b.order)
            const isExpanded = expandedSections.has(subCourse._id)

            return (
              <div key={subCourse._id} className="mb-1">
                {/* Section header */}
                <button
                  onClick={() => toggleSection(subCourse._id)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}
                >
                  <span className={`text-xs font-semibold uppercase tracking-wide truncate pr-2 ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
                    {subCourse.title}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>{sectionLessons.length}</span>
                    {isExpanded
                      ? <ChevronDown className={`w-3.5 h-3.5 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`} />
                      : <ChevronRight className={`w-3.5 h-3.5 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`} />}
                  </div>
                </button>

                {/* Lessons */}
                {isExpanded && (
                  <div>
                    {sectionLessons.map((lesson) => {
                      const isActive = selectedLesson?._id === lesson._id
                      const isDone = lesson._id ? completedLessons.has(lesson._id) : false
                      return (
                        <button
                          key={lesson._id}
                          onClick={() => setSelectedLesson(lesson)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-l-2 ${
                            isActive
                              ? isDark
                                ? 'bg-zinc-700 border-emerald-500'
                                : 'bg-emerald-50 border-emerald-500'
                              : isDark
                                ? 'hover:bg-zinc-800 border-transparent'
                                : 'hover:bg-zinc-100 border-transparent'
                          }`}
                        >
                          {/* Done indicator */}
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                            isDone
                              ? 'bg-emerald-500 border-emerald-500'
                              : isActive
                              ? isDark ? 'border-zinc-400' : 'border-zinc-500'
                              : isDark ? 'border-zinc-600' : 'border-zinc-300'
                          }`}>
                            {isDone
                              ? <Check className="w-3 h-3 text-white" />
                              : <Play className={`w-2.5 h-2.5 ml-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-400'}`} />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className={`text-sm leading-snug truncate ${
                              isActive
                                ? isDark ? 'text-white font-medium' : 'text-emerald-800 font-medium'
                                : isDark ? 'text-zinc-300' : 'text-zinc-700'
                            }`}>
                              {lesson.order}. {lesson.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>{lesson.duration} мин</span>
                              {lesson.isPreview && (
                                <span className="text-xs text-emerald-500">үнэгүй</span>
                              )}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}

          {/* Lessons without subcourse */}
          {(course.lessons || [])
            .filter(l => !l.subCourseId || !subCourses.find(sc => sc._id === l.subCourseId))
            .sort((a, b) => a.order - b.order)
            .map(lesson => {
              const isActive = selectedLesson?._id === lesson._id
              const isDone = lesson._id ? completedLessons.has(lesson._id) : false
              return (
                <button
                  key={lesson._id}
                  onClick={() => setSelectedLesson(lesson)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-l-2 ${
                    isActive
                      ? isDark ? 'bg-zinc-700 border-emerald-500' : 'bg-emerald-50 border-emerald-500'
                      : isDark ? 'hover:bg-zinc-800 border-transparent' : 'hover:bg-zinc-100 border-transparent'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                    isDone ? 'bg-emerald-500 border-emerald-500'
                    : isActive ? isDark ? 'border-zinc-400' : 'border-zinc-500'
                    : isDark ? 'border-zinc-600' : 'border-zinc-300'
                  }`}>
                    {isDone ? <Check className="w-3 h-3 text-white" /> : <Play className={`w-2.5 h-2.5 ml-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-400'}`} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug truncate ${
                      isActive ? isDark ? 'text-white font-medium' : 'text-emerald-800 font-medium'
                      : isDark ? 'text-zinc-300' : 'text-zinc-700'
                    }`}>
                      {lesson.order}. {lesson.title}
                    </p>
                    <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>{lesson.duration} мин</span>
                  </div>
                </button>
              )
            })}
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className={`flex-1 overflow-y-auto flex flex-col ${isDark ? 'bg-zinc-950' : 'bg-white'}`}>

        {/* ── Top bar (minimal) ── */}
        <div className={`flex items-center gap-2 px-4 py-2.5 border-b shrink-0 ${isDark ? 'border-zinc-800 bg-zinc-950' : 'border-zinc-200 bg-white'}`}>
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className={`p-1.5 rounded transition-colors ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}
          >
            <Menu className={`w-4 h-4 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`} />
          </button>
          <div className="flex-1" />
          {canUseFreePreview && (
            <div className={`flex items-center gap-1.5 text-xs font-medium text-orange-600 px-2.5 py-1 rounded-full border ${isDark ? 'bg-orange-950/30 border-orange-800' : 'bg-orange-50 border-orange-200'}`}>
              <Clock className="w-3 h-3" />
              {Math.floor(remainingPreviewSeconds / 60)}:{String(remainingPreviewSeconds % 60).padStart(2, "0")}
            </div>
          )}
          <button
            onClick={() => setIsDark(d => !d)}
            title={isDark ? 'Цайвар горим' : 'Харанхуй горим'}
            className={`p-1.5 rounded-full transition-colors ${isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-yellow-400' : 'hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800'}`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-5">

            {/* Lesson title row — above video like Skool */}
            {selectedLesson && (
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  <span className="text-orange-400 text-lg leading-none mt-0.5">⚡</span>
                  <h2 className={`text-lg font-bold leading-snug ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                    {selectedLesson.title}
                  </h2>
                </div>
                {/* Done indicator — large green circle like Skool */}
                {userHasAccess && selectedLesson._id && (
                  completedLessons.has(selectedLesson._id) ? (
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 shadow-sm">
                      <Check className="w-4 h-4 text-white" strokeWidth={3} />
                    </div>
                  ) : (
                    <button
                      onClick={() => selectedLesson._id && handleMarkAsDone(selectedLesson._id)}
                      title="Дуусгасан гэж тэмдэглэх"
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all hover:scale-110 ${isDark ? 'border-zinc-600 hover:border-emerald-500' : 'border-zinc-300 hover:border-emerald-500'}`}
                    >
                      <Check className={`w-4 h-4 ${isDark ? 'text-zinc-600' : 'text-zinc-300'}`} strokeWidth={3} />
                    </button>
                  )
                )}
              </div>
            )}

            {/* Video player */}
            <div className={`w-full rounded-xl overflow-hidden bg-black shrink-0 shadow-lg ${isDark ? '' : 'ring-1 ring-zinc-200'}`}>
              <div className="relative" style={{ paddingBottom: '56.25%' }}>
                {shouldShowVideo ? (
                  videoReady ? (
                    <iframe
                      key={selectedLesson?._id}
                      src={`${selectedLesson?.videoUrl}${selectedLesson?.videoUrl?.includes('?') ? '&' : '?'}autoplay=true`}
                      className="absolute inset-0 w-full h-full"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  ) : (
                    <div
                      className="absolute inset-0 flex items-center justify-center bg-zinc-950 cursor-pointer group"
                      onClick={() => setVideoReady(true)}
                    >
                      {selectedLesson?.thumbnailUrl && (
                        <img
                          src={selectedLesson.thumbnailUrl}
                          alt={selectedLesson?.title}
                          className="absolute inset-0 w-full h-full object-cover opacity-40"
                        />
                      )}
                      <div className="relative z-10 flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center group-hover:bg-white/25 group-hover:scale-110 transition-all duration-200 shadow-2xl">
                          <Play className="w-7 h-7 text-white ml-1" fill="white" />
                        </div>
                        <span className="text-white/80 text-sm font-medium tracking-wide">Тоглуулах</span>
                      </div>
                    </div>
                  )
                ) : previewExpired ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 text-white">
                    <div className="text-center max-w-sm space-y-4 p-6">
                      <Lock className="w-12 h-12 mx-auto text-zinc-500" />
                      <div>
                        <h3 className="text-lg font-semibold">Үнэгүй хугацаа дууслаа</h3>
                        <p className="text-sm text-zinc-400 mt-1">Үргэлжлүүлэн үзэхийн тулд худалдаж авна уу</p>
                      </div>
                      <Button className="bg-orange-600 hover:bg-orange-700" onClick={() => setShowPaymentModal(true)}>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        {course.price ? `Сургалтад элсэх — ₮${course.price.toLocaleString()}` : 'Сургалтад элсэх'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 text-white">
                    <div className="text-center opacity-40">
                      <Video className="w-12 h-12 mx-auto mb-2" />
                      <p className="text-sm">Хичээл сонгоно уу</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Below video: description + nav */}
            {selectedLesson && (
              <div className="mt-6">
                {/* Duration + preview badge */}
                <div className={`flex items-center gap-3 text-sm mb-4 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{selectedLesson.duration} мин</span>
                  {selectedLesson.isPreview && <Badge variant="secondary" className="text-xs">Үнэгүй</Badge>}
                </div>

                {selectedLesson.description && (
                  <p className={`leading-relaxed text-sm mb-4 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>{selectedLesson.description}</p>
                )}
                {selectedLesson.content && (
                  <div data-color-mode={isDark ? 'dark' : 'light'} className={`text-sm rounded-lg p-4 ${isDark ? 'bg-zinc-900' : 'bg-zinc-50'}`}>
                    <MarkdownPreview source={selectedLesson.content} />
                  </div>
                )}

                {/* Prev / Next */}
                <div className={`flex items-center gap-3 mt-8 pt-5 border-t ${isDark ? 'border-zinc-800' : 'border-zinc-100'}`}>
                  {(() => {
                    const allLessons = (course.lessons || []).sort((a, b) => a.order - b.order)
                    const currentIdx = allLessons.findIndex(l => l._id === selectedLesson._id)
                    const prev = currentIdx > 0 ? allLessons[currentIdx - 1] : null
                    const next = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null
                    return (
                      <>
                        {prev && (
                          <button
                            onClick={() => setSelectedLesson(prev)}
                            className={`flex items-center gap-1.5 text-sm transition-colors ${isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-zinc-900'}`}
                          >
                            <ChevronLeft className="w-4 h-4" />
                            <span className="truncate max-w-[180px]">{prev.title}</span>
                          </button>
                        )}
                        {next && (
                          <button
                            onClick={() => setSelectedLesson(next)}
                            className={`flex items-center gap-1.5 text-sm transition-colors ml-auto ${isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-zinc-900'}`}
                          >
                            <span className="truncate max-w-[180px]">{next.title}</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    )
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {showPaymentModal && course && (
        <PaymentModal
          course={course}
          onClose={() => { setShowPaymentModal(false); refreshUser() }}
        />
      )}
    </div>
    </div>
  )
}
