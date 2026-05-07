"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Users, BookOpen, DollarSign, UserPlus, Database, BarChart3,
  Star, Settings, ArrowUpRight, Activity, CreditCard, Image,
  ChevronRight, Clock, CheckCircle, XCircle, AlertCircle,
  Zap, TrendingUp, TrendingDown, GraduationCap, FileVideo,
  Layers, ShoppingCart,
} from "lucide-react"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts"

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface Stats {
  totalUsers: number
  totalCourses: number
  activeCourses: number
  totalRevenue: number
  subCourses: number
  lessons: number
  pendingPayments: number
  totalEnrollments: number
  thisMonthRevenue: number
  thisMonthEnrollments: number
  newUsersThisMonth: number
  revenueTrend: number
  enrollmentTrend: number
  userTrend: number
  revenueByMonth: { month: string; revenue: number; enrollments: number }[]
  byMethod: Record<string, number>
  topCourses: { _id: string; title: string; enrolledCount: number; price: number; thumbnailUrl?: string }[]
}

interface ActivityItem {
  id: string; type: string; title: string; description: string
  timestamp: Date; status: string; icon: string
}

/* ─── Nav links ──────────────────────────────────────────────────────────── */
const navLinks = [
  { title: "Хэрэглэгчид",  icon: Users,      color: "from-blue-500 to-blue-600",      href: "/admin/users",      desc: "Бүртгэлтэй хэрэглэгчид" },
  { title: "Курсууд",       icon: BookOpen,   color: "from-emerald-500 to-emerald-600", href: "/admin/courses",    desc: "Хичээл удирдлага" },
  { title: "Төлбөрүүд",     icon: CreditCard, color: "from-amber-500 to-amber-600",    href: "/admin/payments",   desc: "Орлого, гүйлгээ" },
  { title: "Media Grid",    icon: Image,      color: "from-violet-500 to-violet-600",  href: "/admin/media-grid", desc: "Зургийн самбар" },
  { title: "Database",      icon: Database,   color: "from-rose-500 to-rose-600",      href: "/admin/database",   desc: "Мэдээллийн сан" },
  { title: "Статистик",     icon: BarChart3,  color: "from-cyan-500 to-cyan-600",      href: "/admin/stats",      desc: "Дэлгэрэнгүй тайлан" },
  { title: "Онцлог",        icon: Star,       color: "from-pink-500 to-pink-600",      href: "/admin/features",   desc: "Ягаад бид?" },
  { title: "Тохиргоо",      icon: Settings,   color: "from-slate-500 to-slate-600",    href: "/admin/settings",   desc: "Системийн тохиргоо" },
]

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function timeAgo(date: Date) {
  const d = Math.floor((Date.now() - new Date(date).getTime()) / 60000)
  if (d < 1) return "Одоо"
  if (d < 60) return `${d}м өмнө`
  if (d < 1440) return `${Math.floor(d / 60)}ц өмнө`
  return `${Math.floor(d / 1440)}х өмнө`
}

function fmt(n: number) { return n.toLocaleString("mn-MN") }

/* ─── Small components ───────────────────────────────────────────────────── */
function Trend({ value }: { value: number }) {
  if (value === 0) return <span className="text-xs text-gray-400">—</span>
  const up = value > 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${up ? "text-emerald-600" : "text-red-500"}`}>
      {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {Math.abs(value)}%
    </span>
  )
}

function KpiCard({ label, value, sub, icon: Icon, color, trend, onClick }: {
  label: string; value: string; sub?: string; icon: any
  color: string; trend?: number; onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all ${onClick ? "cursor-pointer" : ""}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-sm`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend !== undefined && <Trend value={trend} />}
      </div>
      <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
      <p className="text-sm font-medium text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

function MiniCard({ label, value, icon: Icon, color }: {
  label: string; value: string | number; icon: any; color: string
}) {
  return (
    <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm">
      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shrink-0`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div>
        <p className="text-base font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-400">{label}</p>
      </div>
    </div>
  )
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const icon =
    item.status === "success" || item.status === "completed" ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> :
    item.status === "pending" ? <Clock className="w-3.5 h-3.5 text-amber-400" /> :
    item.status === "failed"  ? <XCircle className="w-3.5 h-3.5 text-red-400" /> :
    <AlertCircle className="w-3.5 h-3.5 text-blue-400" />
  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
      <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-sm shrink-0">{item.icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{item.title}</p>
        <p className="text-[11px] text-gray-400 truncate">{item.description}</p>
      </div>
      <div className="shrink-0 text-right">
        <div className="flex justify-end mb-0.5">{icon}</div>
        <p className="text-[10px] text-gray-400">{timeAgo(item.timestamp)}</p>
      </div>
    </div>
  )
}

function ActivityPanel({ activities, onNav }: {
  activities: ActivityItem[]
  onNav: (href: string) => void
}) {
  const [tab, setTab] = useState<"user" | "payment">("user")
  const filtered = activities.filter(a => a.type === tab)
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-blue-500" /> Сүүлийн үйл ажиллагаа
        </h3>
        <button onClick={() => onNav("/admin/payments")} className="text-[11px] text-blue-500 hover:underline flex items-center gap-0.5">
          Бүгд <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-3 shrink-0">
        {(["user", "payment"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 text-xs font-semibold py-1 rounded-md transition-all ${tab === t ? "bg-white text-gray-800 shadow-sm" : "text-gray-500"}`}
          >
            {t === "user" ? "👤 Хэрэглэгч" : "💳 Төлбөр"}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto" style={{ maxHeight: 260 }}>
        {filtered.length === 0
          ? <div className="flex flex-col items-center justify-center h-24 text-gray-300"><Activity className="w-6 h-6 mb-1" /><p className="text-xs">Байхгүй байна</p></div>
          : filtered.map((item, i) => <ActivityRow key={item.id || i} item={item} />)
        }
      </div>
      <div className="mt-3 pt-3 border-t border-gray-50 grid grid-cols-2 gap-2 shrink-0">
        <button onClick={() => onNav("/admin/users")}
          className="text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg py-2 flex items-center justify-center gap-1.5 transition-colors">
          <Users className="w-3.5 h-3.5" /> Хэрэглэгчид
        </button>
        <button onClick={() => onNav("/admin/payments")}
          className="text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg py-2 flex items-center justify-center gap-1.5 transition-colors">
          <CreditCard className="w-3.5 h-3.5" /> Төлбөрүүд
        </button>
      </div>
    </div>
  )
}

/* ─── Skeleton ───────────────────────────────────────────────────────────── */
function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-gray-100 rounded-lg animate-pulse ${className}`} />
}

/* ─── Main ───────────────────────────────────────────────────────────────── */
export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => { checkAuth() }, [])

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/admin/check", { credentials: "include" })
      if (!res.ok) { router.push("/admin/login"); return }
      const data = await res.json()
      if (data.user.role !== "admin") { router.push("/admin/login"); return }
      setAuthLoading(false)
      Promise.all([
        fetch("/api/admin/stats", { credentials: "include" }).then(r => r.json()).then(d => setStats(d)).catch(() => {}),
        fetch("/api/admin/recent-activities", { credentials: "include" }).then(r => r.json()).then(d => setActivities(d.activities || [])).catch(() => {}),
      ]).finally(() => setLoading(false))
    } catch { router.push("/admin/login") }
  }

  const now = new Date()
  const greeting = now.getHours() < 12 ? "Өглөөний мэнд" : now.getHours() < 18 ? "Өдрийн мэнд" : "Оройн мэнд"

  if (authLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
    </div>
  )

  const nav = (href: string) => router.push(href)

  /* custom tooltip for recharts */
  const RevenueTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2 text-sm">
        <p className="font-semibold text-gray-700 mb-1">{label}</p>
        <p className="text-blue-600">₮{fmt(payload[0]?.value ?? 0)}</p>
        <p className="text-violet-500">{payload[1]?.value ?? 0} элсэлт</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-gray-400 font-medium">{greeting} 👋</p>
          <h1 className="text-2xl font-bold text-gray-900 mt-0.5">Хянаалтын самбар</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {now.toLocaleDateString("mn-MN", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {stats?.pendingPayments ? (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 cursor-pointer hover:bg-amber-100 transition-colors" onClick={() => nav("/admin/payments")}>
              <ShoppingCart className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-semibold text-amber-700">{stats.pendingPayments} хүлээгдэж буй төлбөр</span>
            </div>
          ) : null}
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-700">Систем ажиллаж байна</span>
          </div>
        </div>
      </div>

      {/* ── Top KPI row ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-[128px]">
              <Skeleton className="w-10 h-10 rounded-xl mb-3" />
              <Skeleton className="h-6 w-20 mb-2" />
              <Skeleton className="h-3 w-28" />
            </div>
          ))
        ) : stats ? (
          <>
            <KpiCard label="Нийт орлого" value={`₮${fmt(stats.totalRevenue)}`}
              sub={`Энэ сар: ₮${fmt(stats.thisMonthRevenue)}`}
              icon={DollarSign} color="from-blue-500 to-blue-600" trend={stats.revenueTrend}
              onClick={() => nav("/admin/payments")} />
            <KpiCard label="Нийт хэрэглэгч" value={fmt(stats.totalUsers)}
              sub={`Энэ сар +${stats.newUsersThisMonth}`}
              icon={Users} color="from-violet-500 to-violet-600" trend={stats.userTrend}
              onClick={() => nav("/admin/users")} />
            <KpiCard label="Нийт элсэлт" value={fmt(stats.totalEnrollments)}
              sub={`Энэ сар: ${stats.thisMonthEnrollments}`}
              icon={UserPlus} color="from-emerald-500 to-emerald-600" trend={stats.enrollmentTrend} />
            <KpiCard label="Нийт курс" value={fmt(stats.totalCourses)}
              sub={`${stats.activeCourses} идэвхтэй`}
              icon={BookOpen} color="from-amber-500 to-amber-600"
              onClick={() => nav("/admin/courses")} />
          </>
        ) : null}
      </div>

      {/* ── Mini stats row ─────────────────────────────────────────────── */}
      {!loading && stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MiniCard label="Дэд хичээл"   value={fmt(stats.subCourses)}  icon={Layers}       color="from-cyan-400 to-cyan-500" />
          <MiniCard label="Хичээл"        value={fmt(stats.lessons)}     icon={FileVideo}    color="from-indigo-400 to-indigo-500" />
          <MiniCard label="Хүлээгдэж буй" value={stats.pendingPayments} icon={ShoppingCart} color="from-amber-400 to-amber-500" />
          <MiniCard label="Нийт элсэгч"   value={fmt(stats.totalEnrollments)} icon={GraduationCap} color="from-pink-400 to-pink-500" />
        </div>
      )}

      {/* ── Chart + Activity ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Revenue + enrollment chart */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-700">Орлого & элсэлт</h3>
              <p className="text-xs text-gray-400">Сүүлийн 6 сар</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />Орлого</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-violet-400 inline-block" />Элсэлт</span>
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-48 w-full rounded-xl" />
          ) : stats?.revenueByMonth?.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={stats.revenueByMonth} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="enrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="rev" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1000 ? `₮${(v/1000).toFixed(0)}к` : `₮${v}`} />
                <YAxis yAxisId="enr" orientation="right" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip content={<RevenueTooltip />} />
                <Area yAxisId="rev" type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#revGrad)" dot={{ r: 3, fill: "#3b82f6" }} />
                <Area yAxisId="enr" type="monotone" dataKey="enrollments" stroke="#a78bfa" strokeWidth={2} fill="url(#enrGrad)" dot={{ r: 3, fill: "#a78bfa" }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-300 text-sm">Өгөгдөл байхгүй</div>
          )}
        </div>

        {/* Activity panel */}
        <ActivityPanel activities={activities} onNav={nav} />
      </div>

      {/* ── Bottom row: Top courses + quick nav ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Top courses */}
        <div className="lg:col-span-1 bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-400" /> Шилдэг курсууд
            </h3>
            <button onClick={() => nav("/admin/courses")} className="text-[11px] text-blue-500 hover:underline flex items-center gap-0.5">
              Бүгд <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
          ) : stats?.topCourses?.length ? (
            <div className="space-y-2">
              {stats.topCourses.map((course, i) => (
                <div key={course._id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => nav("/admin/courses")}>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                    i === 0 ? "bg-amber-400" : i === 1 ? "bg-gray-300" : i === 2 ? "bg-orange-300" : "bg-gray-100 text-gray-400"
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{course.title}</p>
                    <p className="text-[11px] text-gray-400">{course.enrolledCount} сурагч · ₮{fmt(course.price)}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <GraduationCap className="w-3.5 h-3.5 text-gray-300" />
                    <span className="text-xs font-semibold text-gray-500">{course.enrolledCount}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-gray-300 text-sm">Курс байхгүй</div>
          )}
        </div>

        {/* Quick nav */}
        <div className="lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 mb-3">
            <Zap className="w-4 h-4 text-amber-400" /> Хурдан хандалт
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {navLinks.map(link => {
              const Icon = link.icon
              return (
                <button key={link.href} onClick={() => nav(link.href)}
                  className="group flex flex-col items-center gap-2 bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-gray-200 transition-all text-center">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${link.color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-700">{link.title}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{link.desc}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
