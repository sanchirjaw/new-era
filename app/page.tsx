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
        {/* decorative orbs */}
        <div className="pointer-events-none absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-40"
          style={{ background: "radial-gradient(circle, rgba(0,229,160,0.25) 0%, transparent 70%)" }} />
        <div className="pointer-events-none absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, rgba(123,97,255,0.3) 0%, transparent 70%)" }} />

        <div className="relative container mx-auto px-4 sm:px-6 pt-12 pb-16 md:pt-20 md:pb-24">
          <div className="flex flex-col lg:grid lg:grid-cols-2 lg:gap-12 xl:gap-20 items-center gap-12 max-w-6xl mx-auto">

            {/* ── Left: copy ── */}
            <div className="w-full space-y-7 text-center lg:text-left">

              {/* pill badge */}
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold border"
                style={{ borderColor: "rgba(0,229,160,0.4)", background: "rgba(0,229,160,0.08)", color: "#00c87a" }}>
                <span className="w-2 h-2 rounded-full bg-[#00E5A0] animate-pulse" />
                {featuredCourse?.category || "Монголын онлайн сургалт"}
              </div>

              {/* headline */}
              <div>
                <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black tracking-tight leading-[1.1] text-foreground">
                  Ур чадвараа{" "}
                  <span className="relative inline-block">
                    <span className="bg-clip-text text-transparent" style={{ backgroundImage: GRAD }}>
                      хөгжүүл.
                    </span>
                  </span>
                </h1>
                <h2 className="mt-3 text-2xl sm:text-3xl xl:text-4xl font-bold text-foreground/60 leading-snug">
                  Хэзээ ч, хаанаас ч.
                </h2>
              </div>

              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-md mx-auto lg:mx-0">
                Мэргэжлийн багш нартай, чанартай видео хичээлүүдээр таны карьерыг шинэ шатанд гаргана.
              </p>

              {/* trust checklist */}
              <ul className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-sm text-muted-foreground justify-center lg:justify-start">
                {["HD чанартай видео", "Гэрчилгээ олгоно", "24/7 дэмжлэг"].map(t => (
                  <li key={t} className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#00E5A0" }} />
                    {t}
                  </li>
                ))}
              </ul>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <a href="/courses" className="ne-btn-primary text-sm sm:text-base px-7 py-3 w-full sm:w-auto text-center">
                  Хичээлүүд үзэх
                </a>
                <a href="/register" className="ne-btn-ghost text-sm sm:text-base px-7 py-3 w-full sm:w-auto text-center">
                  Үнэгүй бүртгүүлэх
                </a>
              </div>

              {/* mini stats */}
              <div className="flex gap-8 justify-center lg:justify-start pt-1">
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

            {/* ── Right: featured card ── */}
            <div className="w-full max-w-[400px] mx-auto lg:mx-0">
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

            {/* grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
              {moreCourses.map(course => (
                <Link key={course._id} href={`/courses/${course._id}`}
                  className="ne-card block overflow-hidden group flex flex-col">
                  {/* thumbnail */}
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
                  {/* body */}
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
          FEATURES  —  split layout
      ════════════════════════════════════════════════════ */}
      <section className="py-14 md:py-24 bg-background">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* ── Left: sticky headline block ── */}
            <div className="space-y-6">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#7B61FF" }}>
                Яагаад бид?
              </p>
              <h2 className="text-3xl sm:text-4xl xl:text-5xl font-black text-foreground leading-[1.1]">
                Таны суралцахуйн<br />
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: GRAD }}>
                  итгэлтэй түнш
                </span>
              </h2>
              <p className="text-muted-foreground text-base leading-relaxed max-w-md">
                Зөвхөн видео биш — мэргэжлийн дэмжлэг, хувийн хөгжлийн зам,
                дэлхийн чанартай агуулгыг Монгол хэлээр.
              </p>

              {/* decorative gradient bar */}
              <div className="flex gap-2 pt-2">
                <div className="h-1 w-12 rounded-full" style={{ background: GRAD }} />
                <div className="h-1 w-6 rounded-full bg-border" />
                <div className="h-1 w-3 rounded-full bg-border" />
              </div>

              {/* mini trust stat */}
              <div className="inline-flex items-center gap-3 rounded-2xl px-5 py-3 border border-border bg-card">
                <span className="text-2xl font-black bg-clip-text text-transparent" style={{ backgroundImage: GRAD }}>
                  {stats.totalStudents || "100+"}
                </span>
                <span className="text-sm text-muted-foreground">сурагч аль хэдийн<br />суралцаж байна</span>
              </div>
            </div>

            {/* ── Right: numbered feature list ── */}
            <div className="space-y-4">
              {[
                {
                  num: "01",
                  icon: features.feature1?.icon || "🌍",
                  title: features.feature1?.title || "Хэзээ ч, хаанаас ч",
                  desc: features.feature1?.description || "Таны хүссэн цагт, хүссэн газартаас суралцах боломжтой.",
                },
                {
                  num: "02",
                  icon: features.feature2?.icon || "🎯",
                  title: features.feature2?.title || "Чанартай агуулга",
                  desc: features.feature2?.description || "Мэргэжлийн багш нартай HD чанартай видео хичээллүүд.",
                },
                {
                  num: "03",
                  icon: features.feature3?.icon || "📈",
                  title: features.feature3?.title || "Хувийн хөгжил",
                  desc: features.feature3?.description || "Таны хурдад тохируулсан сургалт, прогресс хяналт.",
                },
              ].map((f) => (
                <div key={f.num}
                  className="group flex gap-5 p-5 rounded-2xl border border-border bg-card
                             hover:border-transparent transition-all duration-300 cursor-default"
                  style={{
                    /* hover: gradient border via box-shadow trick */
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 2px #00E5A0, 0 8px 32px rgba(0,229,160,0.12)"
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow = ""
                  }}
                >
                  {/* number */}
                  <div className="flex-shrink-0 w-10 text-right">
                    <span className="text-2xl font-black bg-clip-text text-transparent leading-none"
                      style={{ backgroundImage: GRAD }}>
                      {f.num}
                    </span>
                  </div>

                  {/* icon */}
                  <div className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-xl
                                  transition-transform duration-300 group-hover:scale-110"
                    style={{ background: "var(--ne-hero-bg)", border: "1px solid var(--border)" }}>
                    {f.icon}
                  </div>

                  {/* text */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base text-card-foreground mb-1">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

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
