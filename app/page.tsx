import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import PublicMediaGrid from "@/components/public-media-grid"
import { Play, Star, Users, Trophy } from "lucide-react"
import type { Course } from "@/lib/types"
import { getDisplayTitle, getDisplayDescription } from "@/lib/course-utils"

const GRAD = "linear-gradient(135deg, #00E5A0 0%, #7B61FF 100%)"

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
    feature2: { title: "Чанартай агуулга", description: "Мэргэжлийн багш нартай, чанартай видео хичээллүүд.", icon: "🎯" },
    feature3: { title: "Хувийн хөгжил", description: "Таны хурдад тохируулсан сургалт. Прогресс хяналт болон багшийн дэмжлэг.", icon: "📈" },
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
  } catch (e) {
    console.error("Error fetching data:", e)
  }

  const featuredCourse = courses.length > 0 ? courses[0] : null
  const moreCourses = courses.slice(1, 6)

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* ─── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: "var(--ne-hero-bg)" }}>
        <div className="pointer-events-none absolute -top-32 -left-32 w-[480px] h-[480px] opacity-60" style={{ background: "var(--ne-orb-1)" }} />
        <div className="pointer-events-none absolute -bottom-24 -right-24 w-[400px] h-[400px] opacity-50" style={{ background: "var(--ne-orb-2)" }} />

        <div className="container mx-auto px-4 pt-10 pb-14 md:py-20 relative">
          <div className="flex flex-col lg:grid lg:grid-cols-2 lg:gap-16 items-center max-w-6xl mx-auto gap-10">

            {/* Text block */}
            <div className="space-y-6 w-full text-center lg:text-left order-1">
              <span className="ne-label inline-flex">
                🚀 {featuredCourse ? featuredCourse.category || "Монголын онлайн сургалт" : "Монголын онлайн сургалт"}
              </span>

              <div className="space-y-1">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-tight">
                  Чанартай{" "}
                  <span className="bg-clip-text text-transparent" style={{ backgroundImage: GRAD }}>
                    хичээлүүд.
                  </span>
                </h1>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground/70 leading-tight">
                  Хэзээ ч, хаанаас ч.
                </h2>
              </div>

              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto lg:mx-0">
                Мэргэжлийн багш нартай, чанартай видео хичээлээр ур чадвараа хөгжүүл.
                Интернэт холболттой хаанаас ч суралцаарай.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <a href="/courses" className="ne-btn-primary text-base px-8 py-3 w-full sm:w-auto text-center">
                  Хичээлүүд үзэх
                </a>
                <a href="/register" className="ne-btn-ghost text-base px-8 py-3 w-full sm:w-auto text-center">
                  Бүртгүүлэх
                </a>
              </div>

              {/* Mini stats */}
              <div className="flex gap-6 pt-1 justify-center lg:justify-start">
                {[
                  { val: stats.totalStudents || "100+", label: "Сурагч" },
                  { val: stats.averageRating || "4.8", label: "Үнэлгээ" },
                  { val: courses.length ? `${courses.length}+` : "10+", label: "Хичээл" },
                ].map((s) => (
                  <div key={s.label} className="text-center lg:text-left">
                    <div className="text-xl sm:text-2xl font-black bg-clip-text text-transparent" style={{ backgroundImage: GRAD }}>
                      {s.val}
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Featured Course Card */}
            <div className="w-full max-w-sm sm:max-w-md mx-auto lg:mx-0 order-2">
              {featuredCourse ? (
                <div className="ne-card overflow-hidden w-full">
                  <div className="p-5 sm:p-6">
                    <h3 className="text-lg sm:text-xl font-bold text-card-foreground mb-1">
                      {getDisplayTitle(featuredCourse.title)}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-4 line-clamp-2">
                      {getDisplayDescription(featuredCourse.title, featuredCourse.description || "Хичээлийн тайлбар")}
                    </p>

                    <div className="relative bg-muted rounded-xl aspect-video mb-4 flex items-center justify-center border border-border overflow-hidden">
                      {featuredCourse.thumbnailUrl ? (
                        <img src={featuredCourse.thumbnailUrl} alt={featuredCourse.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: GRAD }}>
                          <Play className="w-6 h-6 text-white ml-1" />
                        </div>
                      )}
                    </div>

                    <div className="flex items-baseline gap-2 mb-4">
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

                    <a href={`/courses/${featuredCourse._id}`} className="ne-btn-primary w-full text-sm py-3 block text-center">
                      Хичээлд бүртгүүлэх
                    </a>
                  </div>
                </div>
              ) : (
                <div className="ne-card overflow-hidden w-full">
                  <div className="p-5 animate-pulse">
                    <div className="h-5 bg-muted rounded mb-2" />
                    <div className="h-4 bg-muted rounded mb-4 w-3/4" />
                    <div className="bg-muted rounded-xl aspect-video mb-4" />
                    <div className="h-7 bg-muted rounded mb-4 w-1/2" />
                    <div className="h-10 bg-muted rounded" />
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* ─── Media Grid (desktop only) ────────────────────── */}
      <div className="hidden md:block">
        <PublicMediaGrid gridLayout={gridLayout} />
      </div>

      {/* ─── More Courses Grid ────────────────────────────── */}
      {moreCourses.length > 0 && (
        <section className="py-12 md:py-20 bg-background">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-8 md:mb-12">
              <div className="ne-divider" />
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground mb-2">
                Бусад{" "}
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: GRAD }}>
                  хичээлүүд
                </span>
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">Таны сонирхлыг татах хичээлүүдийг олж нээ</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {moreCourses.map((course) => (
                <Link key={course._id} href={`/courses/${course._id}`} className="ne-card block overflow-hidden group">
                  <div className="relative aspect-video overflow-hidden rounded-t-xl bg-muted">
                    {course.thumbnailUrl ? (
                      <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: GRAD }}>
                        <Play className="w-8 h-8 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="p-4 sm:p-5">
                    <h3 className="font-bold text-sm sm:text-base text-card-foreground mb-1 line-clamp-2">{getDisplayTitle(course.title)}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-3 line-clamp-2">
                      {getDisplayDescription(course.title, course.description || "")}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="font-black text-orange-500 text-sm sm:text-base">₮{course.price?.toLocaleString()}</span>
                      <span className="text-xs font-bold bg-clip-text text-transparent" style={{ backgroundImage: GRAD }}>
                        Үзэх →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center mt-8 md:mt-10">
              <a href="/courses" className="ne-btn-ghost text-sm sm:text-base px-8 py-3">
                Бүх хичээлүүд харах
              </a>
            </div>
          </div>
        </section>
      )}

      {/* ─── Why Us ───────────────────────────────────────── */}
      <section className="py-12 md:py-20" style={{ background: "var(--ne-hero-bg)" }}>
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-8 md:mb-12">
            <div className="ne-divider" />
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground mb-2">
              Яагаад{" "}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: GRAD }}>
                Бид?
              </span>
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">Манай платформын онцлог шинж чанарууд</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-8 max-w-4xl mx-auto">
            {[
              { icon: features.feature1?.icon || "🌍", title: features.feature1?.title || "Хэзээ ч, хаанаас ч", desc: features.feature1?.description || "" },
              { icon: features.feature2?.icon || "🎯", title: features.feature2?.title || "Чанартай агуулга", desc: features.feature2?.description || "" },
              { icon: features.feature3?.icon || "📈", title: features.feature3?.title || "Хувийн хөгжил", desc: features.feature3?.description || "" },
            ].map((f, i) => (
              <Card key={i} className="ne-card text-center p-6 md:p-8 border-0 shadow-none">
                <CardContent className="space-y-3 p-0">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto text-2xl" style={{ background: GRAD }}>
                    {f.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-card-foreground mb-1">{f.title}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Stats ────────────────────────────────────────── */}
      <section className="py-12 md:py-20 bg-background">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-8 md:mb-12">
            <div className="ne-divider" />
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground mb-2">
              New Era{" "}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: GRAD }}>
                статистик
              </span>
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">Суралцагчдын амжилт тоо баримтаар</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-8 max-w-4xl mx-auto">
            {[
              { icon: <Users className="w-6 h-6 text-white" />, val: stats.totalStudents || "100+", label: "Нийт сурагч", sub: "Идэвхтэй суралцаж буй" },
              { icon: <Star className="w-6 h-6 text-white" />, val: stats.averageRating || "4.8/5", label: "Дундаж үнэлгээ", sub: "Суралцагчдын сэтгэгдэл" },
              { icon: <Trophy className="w-6 h-6 text-white" />, val: stats.completedLessons || "15,000+", label: "Хичээл дуусгасан", sub: "Амжилттай төгссөн" },
            ].map((s, i) => (
              <Card key={i} className="ne-card text-center p-6 md:p-8 border-0 shadow-none">
                <CardContent className="space-y-3 p-0">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto" style={{ background: GRAD }}>
                    {s.icon}
                  </div>
                  <div>
                    <div className="text-3xl font-black bg-clip-text text-transparent mb-1" style={{ backgroundImage: GRAD }}>
                      {s.val}
                    </div>
                    <div className="text-card-foreground font-bold text-sm mb-1">{s.label}</div>
                    <div className="text-xs text-muted-foreground">{s.sub}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
