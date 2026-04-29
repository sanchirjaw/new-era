import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import PublicMediaGrid from "@/components/public-media-grid"
import { Play, Star, Users, Trophy, CheckCircle, ArrowRight } from "lucide-react"
import type { Course } from "@/lib/types"
import { getDisplayTitle, getDisplayDescription } from "@/lib/course-utils"

const GRAD = "linear-gradient(135deg, #00E5A0 0%, #7B61FF 100%)"
const GRAD_R = "linear-gradient(135deg, #7B61FF 0%, #00E5A0 100%)"

interface Stats {
  totalStudents: string
  averageRating: string
  completedLessons: string
}
interface PlatformFeatures {
  feature1: { title: string; description: string; icon: string }
  feature2: { title: string; description: string; icon: string }
  feature3: { title: string; description: string; icon: string }
}

export default async function Home() {
  let courses: Course[] = []
  let stats: Stats = { totalStudents: "0", averageRating: "4.8", completedLessons: "0" }
  let features: PlatformFeatures = {
    feature1: { title: "Хэзээ ч, хаанаас ч", description: "Таны хүссэн цагт, хүссэн газартаас суралцах боломжтой.", icon: "🌍" },
    feature2: { title: "Чанартай агуулга", description: "Мэргэжлийн багш нартай HD чанартай видео хичээллүүд.", icon: "🎯" },
    feature3: { title: "Хувийн хөгжил", description: "Таны хурдад тохируулсан сургалт, прогресс хяналт.", icon: "📈" },
  }
  let gridLayout: any = null

  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
        process.env.NODE_ENV === "production" ? "https://edunewera.mn" : "http://localhost:3000")

    const [coursesRes, statsRes, featuresRes, gridRes] = await Promise.allSettled([
      fetch(`${baseUrl}/api/courses`, { next: { revalidate: 60 } }),
      fetch(`${baseUrl}/api/stats`, { next: { revalidate: 300 } }),
      fetch(`${baseUrl}/api/features`, { next: { revalidate: 3600 } }),
      fetch(`${baseUrl}/api/media-grid`, { next: { revalidate: 300 } }),
    ])
    if (coursesRes.status === "fulfilled" && coursesRes.value.ok) {
      const d = await coursesRes.value.json(); courses = d.courses || []
    }
    if (statsRes.status === "fulfilled" && statsRes.value.ok) {
      stats = await statsRes.value.json()
    }
    if (featuresRes.status === "fulfilled" && featuresRes.value.ok) {
      const d = await featuresRes.value.json(); if (d.features) features = d.features
    }
    if (gridRes.status === "fulfilled" && gridRes.value.ok) {
      const d = await gridRes.value.json(); if (d.layout?.isPublished) gridLayout = d.layout
    }
  } catch (e) { console.error(e) }

  const featuredCourse = courses[0] ?? null
  const moreCourses = courses.slice(1, 7)

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* ════════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ background: "var(--ne-hero-bg)" }}>
        <div className="pointer-events-none absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-40"
          style={{ background: "radial-gradient(circle, rgba(0,229,160,0.25) 0%, transparent 70%)" }} />
        <div className="pointer-events-none absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, rgba(123,97,255,0.3) 0%, transparent 70%)" }} />

        <div className="relative container mx-auto px-4 sm:px-6 pt-10 pb-14 md:pt-16 md:pb-20">
          <div className="max-w-2xl mx-auto text-center space-y-5">

            {/* pill badge */}
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold border"
              style={{ borderColor: "rgba(0,229,160,0.4)", background: "rgba(0,229,160,0.08)", color: "#00c87a" }}>
              <span className="w-2 h-2 rounded-full bg-[#00E5A0] animate-pulse" />
              {featuredCourse?.category || "Монголын онлайн сургалт"}
            </div>

            {/* headline */}
            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black tracking-tight leading-[1.1] text-foreground">
              Чанартай{" "}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: GRAD }}>хичээлүүд.</span>
              <br />
              <span className="text-foreground/60 text-3xl sm:text-4xl xl:text-5xl font-bold">Хэзээ ч, хаанаас ч.</span>
            </h1>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <a href="/courses" className="ne-btn-primary text-sm sm:text-base px-8 py-3 w-full sm:w-auto text-center">
                Хичээлүүд үзэх
              </a>
              <a href="/register" className="ne-btn-ghost text-sm sm:text-base px-8 py-3 w-full sm:w-auto text-center">
                Үнэгүй бүртгүүлэх
              </a>
            </div>

            {/* mini stats */}
            <div className="flex gap-8 justify-center pt-1">
              {[
                { val: stats.totalStudents || "100+", label: "Сурагч" },
                { val: stats.averageRating || "4.8★", label: "Үнэлгээ" },
                { val: courses.length ? `${courses.length}+` : "10+", label: "Хичээл" },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-xl sm:text-2xl font-black bg-clip-text text-transparent" style={{ backgroundImage: GRAD }}>{s.val}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Featured card — centered below heading ── */}
          <div className="mt-10 w-full max-w-lg mx-auto">
              {featuredCourse ? (
                <div className="ne-card overflow-hidden">
                  {/* thumbnail */}
                  <div className="relative aspect-[16/9] bg-muted overflow-hidden">
                    {featuredCourse.thumbnailUrl ? (
                      <img src={featuredCourse.thumbnailUrl} alt={featuredCourse.title}
                        className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: GRAD }}>
                        <Play className="w-12 h-12 text-white" />
                      </div>
                    )}
                    {/* play overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
                      <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                        <Play className="w-6 h-6 text-gray-900 ml-1" />
                      </div>
                    </div>
                    {/* category badge */}
                    {featuredCourse.category && (
                      <span className="absolute top-3 left-3 ne-label text-xs">{featuredCourse.category}</span>
                    )}
                  </div>

                  <div className="p-5">
                    <h3 className="text-base sm:text-lg font-bold text-card-foreground mb-1 line-clamp-1">
                      {getDisplayTitle(featuredCourse.title)}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-4 line-clamp-2">
                      {getDisplayDescription(featuredCourse.title, featuredCourse.description || "")}
                    </p>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-orange-500">
                          ₮{featuredCourse.price?.toLocaleString() || "0"}
                        </span>
                        {featuredCourse.originalPrice && featuredCourse.originalPrice > featuredCourse.price && (
                          <>
                            <span className="text-sm text-muted-foreground line-through">
                              ₮{featuredCourse.originalPrice.toLocaleString()}
                            </span>
                            <span className="ne-label text-xs">
                              -{Math.round((1 - featuredCourse.price / featuredCourse.originalPrice) * 100)}%
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <a href={`/courses/${featuredCourse._id}`}
                      className="ne-btn-primary w-full text-sm py-2.5 block text-center">
                      Хичээлд элсэх
                    </a>
                  </div>
                </div>
              ) : (
                <div className="ne-card overflow-hidden animate-pulse">
                  <div className="aspect-[16/9] bg-muted" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-full" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                    <div className="h-8 bg-muted rounded w-1/3" />
                    <div className="h-10 bg-muted rounded" />
                  </div>
                </div>
              )}
          </div>

        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          STATS BAND
      ════════════════════════════════════════════════════ */}
      <div style={{ background: GRAD }}>
        <div className="container mx-auto px-4 py-5">
          <div className="flex flex-wrap items-center justify-center sm:justify-around gap-6 max-w-3xl mx-auto">
            {[
              { icon: <Users className="w-5 h-5" />, val: stats.totalStudents || "100+", label: "Сурагч" },
              { icon: <Star className="w-5 h-5" />, val: stats.averageRating || "4.8/5", label: "Үнэлгээ" },
              { icon: <Trophy className="w-5 h-5" />, val: stats.completedLessons || "10,000+", label: "Дуусгасан хичээл" },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-3 text-white">
                <div className="opacity-80">{s.icon}</div>
                <div>
                  <p className="text-xl font-black leading-none">{s.val}</p>
                  <p className="text-xs opacity-80 mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          MEDIA GRID (desktop)
      ════════════════════════════════════════════════════ */}
      <div className="hidden md:block">
        <PublicMediaGrid gridLayout={gridLayout} />
      </div>

      {/* ════════════════════════════════════════════════════
          COURSES GRID
      ════════════════════════════════════════════════════ */}
      {moreCourses.length > 0 && (
        <section className="py-14 md:py-20 bg-background">
          <div className="container mx-auto px-4 sm:px-6 max-w-6xl">

            {/* section header */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#00E5A0" }}>Хичээлүүд</p>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground leading-tight">
                  Шилдэг{" "}
                  <span className="bg-clip-text text-transparent" style={{ backgroundImage: GRAD }}>хичээлүүд</span>
                </h2>
              </div>
              <a href="/courses" className="ne-btn-ghost text-sm px-5 py-2 self-start sm:self-auto whitespace-nowrap flex items-center gap-1.5">
                Бүгдийг харах <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {/* ── mobile: horizontal scroll carousel / desktop: grid ── */}
            {/* mobile scroll wrapper */}
            <div className="sm:hidden -mx-4 px-4">
              <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 scroll-smooth"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                {moreCourses.map(course => (
                  <Link key={course._id} href={`/courses/${course._id}`}
                    className="ne-card flex-none w-[78vw] max-w-[300px] overflow-hidden group flex flex-col snap-start">
                    <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                      {course.thumbnailUrl ? (
                        <img src={course.thumbnailUrl} alt={course.title}
                          className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: GRAD }}>
                          <Play className="w-8 h-8 text-white" />
                        </div>
                      )}
                      {course.category && (
                        <span className="absolute top-2 left-2 ne-label text-xs">{course.category}</span>
                      )}
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="font-bold text-sm text-card-foreground line-clamp-2 mb-1 flex-1">
                        {getDisplayTitle(course.title)}
                      </h3>
                      <div className="flex items-center justify-between pt-3 border-t border-border mt-auto">
                        <span className="font-black text-orange-500 text-sm">₮{course.price?.toLocaleString()}</span>
                        <span className="text-xs font-semibold bg-clip-text text-transparent flex items-center gap-1"
                          style={{ backgroundImage: GRAD }}>
                          Үзэх <ArrowRight className="w-3 h-3" style={{ color: "#7B61FF" }} />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
                {/* end padding card */}
                <div className="flex-none w-4" />
              </div>
              {/* swipe hint */}
              <p className="text-center text-xs text-muted-foreground mt-1 opacity-60">← зүүн тийш гүйлгэнэ →</p>
            </div>

            {/* desktop grid */}
            <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
              {moreCourses.map(course => (
                <Link key={course._id} href={`/courses/${course._id}`}
                  className="ne-card block overflow-hidden group flex flex-col">
                  <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                    {course.thumbnailUrl ? (
                      <img src={course.thumbnailUrl} alt={course.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: GRAD }}>
                        <Play className="w-10 h-10 text-white" />
                      </div>
                    )}
                    {course.category && (
                      <span className="absolute top-2.5 left-2.5 ne-label text-xs">{course.category}</span>
                    )}
                  </div>
                  <div className="p-4 sm:p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-sm sm:text-base text-card-foreground line-clamp-2 mb-1 flex-1">
                      {getDisplayTitle(course.title)}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                      {getDisplayDescription(course.title, course.description || "")}
                    </p>
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <span className="font-black text-orange-500">₮{course.price?.toLocaleString()}</span>
                      <span className="text-xs font-semibold flex items-center gap-1 bg-clip-text text-transparent"
                        style={{ backgroundImage: GRAD }}>
                        Үзэх <ArrowRight className="w-3 h-3" style={{ color: "#7B61FF" }} />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════
          FEATURES  —  3 columns (all screen sizes)
      ════════════════════════════════════════════════════ */}
      <section className="py-12 md:py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">

          <div className="text-center mb-8 md:mb-12">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#7B61FF" }}>Яагаад бид?</p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground">
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: GRAD }}>New Era</span>
              {" "}сонгох шалтгаан
            </h2>
          </div>

          {/* always 3 columns */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 md:gap-8">
            {[
              {
                icon: features.feature1?.icon || "🌍",
                title: features.feature1?.title || "Хэзээ ч, хаанаас ч",
                desc: features.feature1?.description || "Хүссэн цагтаа, хүссэн газраасаа суралц.",
              },
              {
                icon: features.feature2?.icon || "🎯",
                title: features.feature2?.title || "Чанартай агуулга",
                desc: features.feature2?.description || "Мэргэжлийн багш нартай HD видео хичээл.",
              },
              {
                icon: features.feature3?.icon || "📈",
                title: features.feature3?.title || "Хувийн хөгжил",
                desc: features.feature3?.description || "Прогресс хяналт, багшийн дэмжлэг.",
              },
            ].map((f, i) => (
              <div key={i}
                className="ne-card flex flex-col items-center text-center p-3 sm:p-6 md:p-8 group">
                {/* icon */}
                <div
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center
                             text-xl sm:text-2xl mb-3 sm:mb-4 flex-shrink-0
                             transition-transform duration-300 group-hover:scale-110"
                  style={{ background: GRAD }}>
                  {f.icon}
                </div>
                {/* title */}
                <h3 className="font-bold text-xs sm:text-base text-card-foreground mb-1 leading-tight">
                  {f.title}
                </h3>
                {/* desc — hidden on very small, visible sm+ */}
                <p className="hidden sm:block text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          CTA BANNER
      ════════════════════════════════════════════════════ */}
      <section className="py-14 md:py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          <div className="relative overflow-hidden rounded-3xl p-8 sm:p-12 text-center"
            style={{ background: GRAD }}>
            {/* decorative circles */}
            <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/10" />

            <p className="text-white/80 text-sm font-semibold uppercase tracking-widest mb-3">Өнөөдрөөс эхлэ</p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-4 leading-tight">
              Ирээдүйгээ өөрчлөх цаг<br className="hidden sm:block" /> болсон
            </h2>
            <p className="text-white/80 text-sm sm:text-base mb-8 max-w-md mx-auto">
              Мэргэжлийн багш нартай, чанартай хичээлүүд таныг хүлээж байна.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="/courses"
                className="inline-flex items-center justify-center gap-2 bg-white font-bold px-8 py-3 rounded-xl text-sm transition-all hover:scale-105 hover:shadow-lg"
                style={{ color: "#7B61FF" }}>
                Хичээл харах <ArrowRight className="w-4 h-4" />
              </a>
              <a href="/register"
                className="inline-flex items-center justify-center gap-2 border-2 border-white/60 text-white font-bold px-8 py-3 rounded-xl text-sm transition-all hover:bg-white/10">
                Үнэгүй бүртгүүлэх
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
