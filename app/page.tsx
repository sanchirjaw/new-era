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
    feature1: { title: "Хэзээ ч, хаанаас ч", description: "Таны хүссэн цагт, хүссэн газартаас суралцах боломжтой. Интернэт холболттой компьютер, таблет эсвэл утас хүчилтэй.", icon: "🌍" },
    feature2: { title: "Чанартай агуулга", description: "Мэргэжлийн багш нартай, чанартай видео хичээллүүд. Практик даалгавар, тестүүд болон сертификат.", icon: "🎯" },
    feature3: { title: "Хувийн хөгжил", description: "Таны хурдад тохируулсан сургалт. Прогресс хяналт, хувийн дэвтэр болон багшийн дэмжлэг.", icon: "📈" },
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
        {/* Ambient orbs */}
        <div className="pointer-events-none absolute -top-32 -left-32 w-[480px] h-[480px] opacity-60" style={{ background: "var(--ne-orb-1)" }} />
        <div className="pointer-events-none absolute -bottom-24 -right-24 w-[400px] h-[400px] opacity-50" style={{ background: "var(--ne-orb-2)" }} />

        <div className="container mx-auto px-4 py-20 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            <div className="space-y-8">
              {/* Badge */}
              <span className="ne-label">
                🚀 {featuredCourse ? featuredCourse.category || "Монголын онлайн сургалт" : "Монголын онлайн сургалт"}
              </span>

              {/* Heading */}
              <div className="space-y-2">
                <h1 className="text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-tight">
                  Чанартай{" "}
                  <span
                    className="bg-clip-text text-transparent"
                    style={{ backgroundImage: GRAD }}
                  >
                    хичээлүүд.
                  </span>
                </h1>
                <h2 className="text-3xl lg:text-4xl font-bold text-foreground/80 leading-tight">
                  Хэзээ ч, хаанаас ч.
                </h2>
              </div>

              <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
                Мэргэжлийн багш нартай, чанартай видео хичээлээр ур чадвараа хөгжүүл.
                Интернэт холболттой хаанаас ч суралцаарай.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <a href="/courses" className="ne-btn-primary text-base px-8 py-3">
                  Хичээлүүд үзэх
                </a>
                <a href="/register" className="ne-btn-ghost text-base px-8 py-3">
                  Бүртгүүлэх
                </a>
              </div>

              {/* Mini stats */}
              <div className="flex gap-8 pt-2">
                {[
                  { val: stats.totalStudents || "100+", label: "Сурагч" },
                  { val: stats.averageRating || "4.8", label: "Үнэлгээ" },
                  { val: courses.length ? `${courses.length}+` : "10+", label: "Хичээл" },
                ].map((s) => (
                  <div key={s.label}>
                    <div
                      className="text-2xl font-black bg-clip-text text-transparent"
                      style={{ backgroundImage: GRAD }}
                    >
                      {s.val}
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Featured Course Card */}
            {featuredCourse ? (
              <div className="ne-card overflow-hidden max-w-sm sm:max-w-md md:max-w-lg mx-auto w-full">
                <div className="p-6 md:p-8">
                  <h3 className="text-xl md:text-2xl font-bold text-card-foreground mb-2">
                    {getDisplayTitle(featuredCourse.title)}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-5">
                    {getDisplayDescription(featuredCourse.title, featuredCourse.description || "Хичээлийн тайлбар")}
                  </p>

                  <div className="relative bg-muted rounded-xl aspect-video mb-5 flex items-center justify-center border border-border overflow-hidden">
                    {featuredCourse.thumbnailUrl ? (
                      <img src={featuredCourse.thumbnailUrl} alt={featuredCourse.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: GRAD }}>
                        <Play className="w-7 h-7 text-white ml-1" />
                      </div>
                    )}
                  </div>

                  <div className="mb-5">
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-2xl md:text-3xl font-black text-orange-500">
                        ₮{featuredCourse.price?.toLocaleString() || "0"}
                      </span>
                      {featuredCourse.originalPrice && featuredCourse.originalPrice > featuredCourse.price && (
                        <>
                          <span className="text-base text-muted-foreground line-through">
                            ₮{featuredCourse.originalPrice.toLocaleString()}
                          </span>
                          <span className="ne-label text-xs">
                            SAVE ₮{(featuredCourse.originalPrice - featuredCourse.price).toLocaleString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <a href={`/courses/${featuredCourse._id}`} className="ne-btn-primary w-full text-sm py-3 block text-center">
                    Хичээлд бүртгүүлэх
                  </a>
                </div>
              </div>
            ) : (
              <div className="ne-card overflow-hidden max-w-sm sm:max-w-md md:max-w-lg mx-auto w-full">
                <div className="p-6 animate-pulse">
                  <div className="h-6 bg-muted rounded mb-3" />
                  <div className="h-4 bg-muted rounded mb-5" />
                  <div className="bg-muted rounded-xl aspect-video mb-5" />
                  <div className="h-8 bg-muted rounded mb-4" />
                  <div className="h-10 bg-muted rounded" />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── More Courses Grid ────────────────────────────── */}
      {moreCourses.length > 0 && (
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-12">
              <div className="ne-divider" />
              <h2 className="text-3xl lg:text-4xl font-black text-foreground mb-3">
                Бусад{" "}
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: GRAD }}>
                  хичээлүүд
                </span>
              </h2>
              <p className="text-muted-foreground">Таны сонирхлыг татах хичээлүүдийг олж нээ</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {moreCourses.map((course) => (
                <Link key={course._id} href={`/courses/${course._id}`} className="ne-card block overflow-hidden group">
                  <div className="relative aspect-video overflow-hidden rounded-t-xl bg-muted">
                    {course.thumbnailUrl ? (
                      <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: GRAD }}>
                        <Play className="w-10 h-10 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-card-foreground mb-1 line-clamp-2">{getDisplayTitle(course.title)}</h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {getDisplayDescription(course.title, course.description || "")}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="font-black text-orange-500">₮{course.price?.toLocaleString()}</span>
                      <span
                        className="text-xs font-bold bg-clip-text text-transparent"
                        style={{ backgroundImage: GRAD }}
                      >
                        Үзэх →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center mt-10">
              <a href="/courses" className="ne-btn-ghost text-base px-10 py-3">
                Бүх хичээлүүд харах
              </a>
            </div>
          </div>
        </section>
      )}

      {/* ─── Media Grid ───────────────────────────────────── */}
      <div className="hidden md:block">
        <PublicMediaGrid gridLayout={gridLayout} />
      </div>

      {/* ─── Why Us ───────────────────────────────────────── */}
      <section className="py-20" style={{ background: "var(--ne-hero-bg)" }}>
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <div className="ne-divider" />
            <h2 className="text-3xl lg:text-4xl font-black text-foreground mb-3">
              Яагаад{" "}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: GRAD }}>
                Бид?
              </span>
            </h2>
            <p className="text-muted-foreground">Манай платформын онцлог шинж чанарууд</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { icon: features.feature1?.icon || "🌍", title: features.feature1?.title || "Хэзээ ч, хаанаас ч", desc: features.feature1?.description || "" },
              { icon: features.feature2?.icon || "🎯", title: features.feature2?.title || "Чанартай агуулга", desc: features.feature2?.description || "" },
              { icon: features.feature3?.icon || "📈", title: features.feature3?.title || "Хувийн хөгжил", desc: features.feature3?.description || "" },
            ].map((f, i) => (
              <Card key={i} className="ne-card text-center p-8 border-0 shadow-none">
                <CardContent className="space-y-4 p-0">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto text-2xl"
                    style={{ background: "var(--ne-grad)", opacity: 0.9 }}
                  >
                    {f.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-card-foreground mb-1">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Stats ────────────────────────────────────────── */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <div className="ne-divider" />
            <h2 className="text-3xl lg:text-4xl font-black text-foreground mb-3">
              New Era{" "}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: GRAD }}>
                статистик
              </span>
            </h2>
            <p className="text-muted-foreground">Суралцагчдын амжилт тоо баримтаар</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { icon: <Users className="w-7 h-7 text-white" />, val: stats.totalStudents || "100+", label: "Нийт сурагч", sub: "Идэвхтэй суралцаж буй" },
              { icon: <Star className="w-7 h-7 text-white" />, val: stats.averageRating || "4.8/5", label: "Дундаж үнэлгээ", sub: "Суралцагчдын сэтгэгдэл" },
              { icon: <Trophy className="w-7 h-7 text-white" />, val: stats.completedLessons || "15,000+", label: "Хичээл дуусгасан", sub: "Амжилттай төгссөн" },
            ].map((s, i) => (
              <Card key={i} className="ne-card text-center p-8 border-0 shadow-none">
                <CardContent className="space-y-4 p-0">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
                    style={{ background: GRAD }}
                  >
                    {s.icon}
                  </div>
                  <div>
                    <div
                      className="text-4xl font-black bg-clip-text text-transparent mb-1"
                      style={{ backgroundImage: GRAD }}
                    >
                      {s.val}
                    </div>
                    <div className="text-card-foreground font-bold mb-1">{s.label}</div>
                    <div className="text-sm text-muted-foreground">{s.sub}</div>
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
