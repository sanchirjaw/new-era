"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Users, BookOpen, DollarSign, TrendingUp, UserPlus,
  Database, BarChart3, Star, Settings, ArrowUpRight, Activity,
  CreditCard, Image, ChevronRight, Clock, CheckCircle, XCircle,
  AlertCircle, Zap,
} from "lucide-react"

interface AdminStats {
  totalUsers: number
  totalCourses: number
  totalRevenue: number
  thisMonthEnrollments: number
}

interface ActivityItem {
  id: string
  type: string
  action: string
  title: string
  description: string
  timestamp: Date
  status: string
  icon: string
}

const navLinks = [
  { title: "Хэрэглэгчид",  icon: Users,     color: "from-blue-500 to-blue-600",    href: "/admin/users",      desc: "Бүртгэлтэй хэрэглэгчид" },
  { title: "Курсууд",       icon: BookOpen,  color: "from-emerald-500 to-emerald-600", href: "/admin/courses",  desc: "Хичээл удирдлага" },
  { title: "Төлбөрүүд",     icon: CreditCard,color: "from-amber-500 to-amber-600",  href: "/admin/payments",   desc: "Орлого, гүйлгээ" },
  { title: "Media Grid",    icon: Image,     color: "from-violet-500 to-violet-600", href: "/admin/media-grid", desc: "Зураг зохион байгуулалт" },
  { title: "Database",      icon: Database,  color: "from-rose-500 to-rose-600",    href: "/admin/database",   desc: "Мэдээллийн сан" },
  { title: "Статистик",     icon: BarChart3, color: "from-cyan-500 to-cyan-600",    href: "/admin/stats",      desc: "Дэлгэрэнгүй тайлан" },
  { title: "Онцлог",        icon: Star,      color: "from-pink-500 to-pink-600",    href: "/admin/features",   desc: "Ягаад бид?" },
  { title: "Тохиргоо",      icon: Settings,  color: "from-slate-500 to-slate-600",  href: "/admin/settings",   desc: "Системийн тохиргоо" },
]

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string; sub?: string; icon: any; color: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-sm mb-4`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
      <p className="text-sm font-medium text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

function timeAgo(date: Date) {
  const diff = Date.now() - new Date(date).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "Одоо"
  if (m < 60) return `${m}м өмнө`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}ц өмнө`
  return `${Math.floor(h / 24)}х өмнө`
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const statusIcon =
    item.status === "success" || item.status === "completed"
      ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
      : item.status === "pending"
      ? <Clock className="w-3.5 h-3.5 text-amber-500" />
      : item.status === "failed"
      ? <XCircle className="w-3.5 h-3.5 text-red-400" />
      : <AlertCircle className="w-3.5 h-3.5 text-blue-400" />

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/60 rounded-lg px-2 -mx-2 transition-colors">
      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm shrink-0">
        {item.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{item.title}</p>
        <p className="text-xs text-gray-400 truncate">{item.description}</p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        {statusIcon}
        <span className="text-[11px] text-gray-400 tabular-nums">{timeAgo(item.timestamp)}</span>
      </div>
    </div>
  )
}

function ActivityPanel({ activities, onUsersClick, onPaymentsClick }: {
  activities: ActivityItem[]
  onUsersClick: () => void
  onPaymentsClick: () => void
}) {
  const [tab, setTab] = useState<"user" | "payment">("user")
  const filtered = activities.filter(a => a.type === tab)

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-500" /> Сүүлийн үйл ажиллагаа
        </h2>
        <button
          onClick={onPaymentsClick}
          className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1 font-medium"
        >
          Бүгдийг харах <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-4 shrink-0">
        {(["user", "payment"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-all ${
              tab === t ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "user" ? "👤 Хэрэглэгч" : "💳 Төлбөр"}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto min-h-0" style={{ maxHeight: 300 }}>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-28 text-gray-400">
            <Activity className="w-7 h-7 mb-2 opacity-25" />
            <p className="text-sm">Үйл ажиллагаа байхгүй байна</p>
          </div>
        ) : filtered.map((item, i) => (
          <ActivityRow key={item.id || i} item={item} />
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-50 grid grid-cols-2 gap-2 shrink-0">
        <button
          onClick={onUsersClick}
          className="flex items-center justify-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg py-2 transition-colors"
        >
          <Users className="w-3.5 h-3.5" /> Хэрэглэгчид
        </button>
        <button
          onClick={onPaymentsClick}
          className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg py-2 transition-colors"
        >
          <CreditCard className="w-3.5 h-3.5" /> Төлбөрүүд
        </button>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({ totalUsers: 0, totalCourses: 0, totalRevenue: 0, thisMonthEnrollments: 0 })
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [authLoading, setAuthLoading] = useState(true)
  const router = useRouter()

  useEffect(() => { checkAuth() }, [])

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/admin/check", { credentials: "include" })
      if (!res.ok) { router.push("/admin/login"); return }
      const data = await res.json()
      if (data.user.role !== "admin") { router.push("/admin/login"); return }
      setAuthLoading(false)
      Promise.all([
        fetch("/api/admin/stats").then(r => r.json()).then(d => setStats(d)).catch(() => {}),
        fetch("/api/admin/recent-activities").then(r => r.json()).then(d => setActivities(d.activities || [])).catch(() => {}),
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

  return (
    <div className="max-w-6xl mx-auto space-y-7 pb-10">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-400 mb-1">{greeting} 👋</p>
          <h1 className="text-2xl font-bold text-gray-900">Админ удирдлага</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {now.toLocaleDateString("mn-MN", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 shrink-0">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-emerald-700">Систем ажиллаж байна</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-[128px] animate-pulse">
              <div className="w-11 h-11 bg-gray-100 rounded-xl mb-4" />
              <div className="h-6 bg-gray-100 rounded w-16 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-24" />
            </div>
          ))
        ) : (
          <>
            <StatCard label="Нийт хэрэглэгч"  value={stats.totalUsers.toLocaleString()}          sub="Бүртгэлтэй нийт"     icon={Users}     color="from-blue-500 to-blue-600" />
            <StatCard label="Нийт курс"         value={stats.totalCourses.toLocaleString()}         sub="Нийтлэгдсэн"         icon={BookOpen}  color="from-emerald-500 to-emerald-600" />
            <StatCard label="Нийт орлого"       value={`₮${stats.totalRevenue.toLocaleString()}`}  sub="Амжилттай төлбөр"   icon={DollarSign} color="from-amber-500 to-amber-600" />
            <StatCard label="Энэ сарын элсэлт" value={stats.thisMonthEnrollments.toLocaleString()} sub="Шинэ сурагчид"        icon={UserPlus}  color="from-violet-500 to-violet-600" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Quick nav */}
        <div className="lg:col-span-3 space-y-3">
          <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" /> Хурдан хандалт
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {navLinks.map((link) => {
              const Icon = link.icon
              return (
                <button
                  key={link.href}
                  onClick={() => router.push(link.href)}
                  className="group flex items-center gap-3 bg-white border border-gray-100 rounded-xl p-3.5 shadow-sm hover:shadow-md hover:border-gray-200 transition-all text-left"
                >
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${link.color} flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{link.title}</p>
                    <p className="text-xs text-gray-400 truncate">{link.desc}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-400 shrink-0 transition-colors" />
                </button>
              )
            })}
          </div>
        </div>

        {/* Activity panel */}
        <div className="lg:col-span-2">
          <ActivityPanel
            activities={activities}
            onUsersClick={() => router.push("/admin/users")}
            onPaymentsClick={() => router.push("/admin/payments")}
          />
        </div>
      </div>
    </div>
  )
}
