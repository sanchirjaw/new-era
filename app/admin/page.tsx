"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Users, BookOpen, DollarSign, UserPlus, Database, BarChart3,
  Star, Settings, ArrowUpRight, Activity, CreditCard, Image,
  ChevronLeft, ChevronRight, Clock, CheckCircle, XCircle, AlertCircle,
  Zap, TrendingUp, TrendingDown, GraduationCap, FileVideo,
  Layers, ShoppingCart, Plus, Trash2, Receipt, X,
} from "lucide-react"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts"

/* ─── Types ─────────────────────────────────────────────────────────────── */
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
interface Expense {
  _id: string
  description: string
  amount: number
  category: string
  date: string
  createdAt?: string
}
interface DailyData {
  day: string
  revenue: number
  expenses: number
  profit: number
}
interface ActivityItem {
  id: string; type: string; title: string; description: string
  timestamp: Date; status: string; icon: string
}

/* ─── Constants ─────────────────────────────────────────────────────────── */
const MONTHS_MN = [
  "1-р сар","2-р сар","3-р сар","4-р сар","5-р сар","6-р сар",
  "7-р сар","8-р сар","9-р сар","10-р сар","11-р сар","12-р сар",
]
const EXP_CATS = ["Маркетинг","Тоног төхөөрөмж","Цалин","Сервер","Бусад"]

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

/* ─── Helpers ───────────────────────────────────────────────────────────── */
function timeAgo(date: Date) {
  const d = Math.floor((Date.now() - new Date(date).getTime()) / 60000)
  if (d < 1) return "Одоо"
  if (d < 60) return `${d}м өмнө`
  if (d < 1440) return `${Math.floor(d / 60)}ц өмнө`
  return `${Math.floor(d / 1440)}х өмнө`
}
function fmt(n: number) { return n.toLocaleString("mn-MN") }
function todayISO() { return new Date().toISOString().slice(0, 10) }

/* ─── Small components ──────────────────────────────────────────────────── */
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
    <div onClick={onClick}
      className={`bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all ${onClick ? "cursor-pointer" : ""}`}>
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
            className={`flex-1 text-xs font-semibold py-1 rounded-md transition-all ${tab === t ? "bg-white text-gray-800 shadow-sm" : "text-gray-500"}`}>
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

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-gray-100 rounded-lg animate-pulse ${className}`} />
}

/* ─── Add Expense Modal ─────────────────────────────────────────────────── */
function AddExpenseModal({ open, onClose, onSaved }: {
  open: boolean; onClose: () => void; onSaved: () => void
}) {
  const [form, setForm] = useState({ description: "", amount: "", category: "Бусад", date: todayISO() })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState("")

  const handleSave = async () => {
    if (!form.description || !form.amount || !form.date) { setErr("Бүх талбарыг бөглөнө үү"); return }
    setSaving(true); setErr("")
    try {
      const res = await fetch("/api/admin/expenses", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      })
      if (!res.ok) { const d = await res.json(); setErr(d.error || "Алдаа гарлаа"); return }
      setForm({ description: "", amount: "", category: "Бусад", date: todayISO() })
      onSaved()
      onClose()
    } catch { setErr("Алдаа гарлаа") }
    finally { setSaving(false) }
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-orange-500" /> Зарлага нэмэх
          </h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Тайлбар</label>
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Серверийн төлбөр..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Дүн (₮)</label>
              <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="50000" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Огноо</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Ангилал</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white">
              {EXP_CATS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {err && <p className="text-xs text-red-500 font-medium">{err}</p>}
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-2.5 text-sm font-semibold hover:bg-gray-50 transition-colors">
            Болих
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors disabled:opacity-60">
            {saving ? "Хадгалж байна..." : "Хадгалах"}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Main ──────────────────────────────────────────────────────────────── */
export default function AdminDashboard() {
  const router = useRouter()
  const now = new Date()

  const [stats, setStats] = useState<Stats | null>(null)
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [authLoading, setAuthLoading] = useState(true)

  // Chart state
  const [chartMode, setChartMode] = useState<"monthly" | "daily">("monthly")
  const [chartYear, setChartYear] = useState(now.getFullYear())
  const [chartMonth, setChartMonth] = useState(now.getMonth() + 1)
  const [dailyData, setDailyData] = useState<DailyData[]>([])
  const [dailyLoading, setDailyLoading] = useState(false)

  // Expenses
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [expLoading, setExpLoading] = useState(false)
  const [showAddExp, setShowAddExp] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Finance summary
  const [monthRevenue, setMonthRevenue] = useState(0)
  const [monthExpenses, setMonthExpenses] = useState(0)

  useEffect(() => { checkAuth() }, [])

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/admin/check", { credentials: "include" })
      if (!res.ok) { router.push("/admin/login"); return }
      const data = await res.json()
      if (data.user.role !== "admin") { router.push("/admin/login"); return }
      setAuthLoading(false)
      await Promise.all([
        fetch("/api/admin/stats", { credentials: "include" }).then(r => r.json()).then(d => setStats(d)).catch(() => {}),
        fetch("/api/admin/recent-activities", { credentials: "include" }).then(r => r.json()).then(d => setActivities(d.activities || [])).catch(() => {}),
      ])
      setLoading(false)
    } catch { router.push("/admin/login") }
  }

  const fetchDailyAndExpenses = useCallback(async (year: number, month: number) => {
    setDailyLoading(true)
    setExpLoading(true)
    try {
      const [dailyRes, expRes] = await Promise.all([
        fetch(`/api/admin/revenue-daily?year=${year}&month=${month}`, { credentials: "include" }),
        fetch(`/api/admin/expenses?year=${year}&month=${month}`, { credentials: "include" }),
      ])
      if (dailyRes.ok) {
        const d = await dailyRes.json()
        setDailyData(d.days || [])
        const rev = (d.days || []).reduce((s: number, row: DailyData) => s + row.revenue, 0)
        const exp = (d.days || []).reduce((s: number, row: DailyData) => s + row.expenses, 0)
        setMonthRevenue(rev)
        setMonthExpenses(exp)
      }
      if (expRes.ok) {
        const e = await expRes.json()
        setExpenses(e.expenses || [])
      }
    } finally {
      setDailyLoading(false)
      setExpLoading(false)
    }
  }, [])

  // Fetch when auth ready
  useEffect(() => {
    if (!authLoading) fetchDailyAndExpenses(chartYear, chartMonth)
  }, [authLoading])

  // Refetch when month changes in daily mode
  useEffect(() => {
    if (!authLoading && chartMode === "daily") fetchDailyAndExpenses(chartYear, chartMonth)
  }, [chartMode, chartYear, chartMonth])

  const prevMonth = () => {
    if (chartMonth === 1) { setChartMonth(12); setChartYear(y => y - 1) }
    else setChartMonth(m => m - 1)
  }
  const nextMonth = () => {
    const canGoNext = chartYear < now.getFullYear() || (chartYear === now.getFullYear() && chartMonth < now.getMonth() + 1)
    if (!canGoNext) return
    if (chartMonth === 12) { setChartMonth(1); setChartYear(y => y + 1) }
    else setChartMonth(m => m + 1)
  }

  const handleDeleteExpense = async (id: string) => {
    setDeletingId(id)
    try {
      await fetch(`/api/admin/expenses/${id}`, { method: "DELETE", credentials: "include" })
      setExpenses(prev => prev.filter(e => e._id !== id))
      fetchDailyAndExpenses(chartYear, chartMonth)
    } finally { setDeletingId(null) }
  }

  const greeting = now.getHours() < 12 ? "Өглөөний мэнд" : now.getHours() < 18 ? "Өдрийн мэнд" : "Оройн мэнд"

  if (authLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
    </div>
  )

  const nav = (href: string) => router.push(href)

  const MonthlyTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2 text-sm">
        <p className="font-semibold text-gray-700 mb-1">{label}</p>
        <p className="text-blue-600">Орлого: ₮{fmt(payload[0]?.value ?? 0)}</p>
        <p className="text-violet-500">Элсэлт: {payload[1]?.value ?? 0}</p>
      </div>
    )
  }

  const DailyTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    const get = (key: string) => payload.find((p: any) => p.dataKey === key)?.value ?? 0
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2 text-sm">
        <p className="font-semibold text-gray-700 mb-1">{label}-р өдөр</p>
        <p className="text-blue-600">Орлого: ₮{fmt(get("revenue"))}</p>
        <p className="text-orange-500">Зарлага: ₮{fmt(get("expenses"))}</p>
        <p className="text-emerald-600">Ашиг: ₮{fmt(get("profit"))}</p>
      </div>
    )
  }

  const canGoNext = chartYear < now.getFullYear() || (chartYear === now.getFullYear() && chartMonth < now.getMonth() + 1)
  const displayRevenue = chartMode === "daily" ? monthRevenue : (stats?.thisMonthRevenue ?? 0)
  const displayExpenses = monthExpenses
  const displayProfit = displayRevenue - displayExpenses

  return (
    <>
      <AddExpenseModal
        open={showAddExp}
        onClose={() => setShowAddExp(false)}
        onSaved={() => fetchDailyAndExpenses(chartYear, chartMonth)}
      />

      <div className="max-w-7xl mx-auto space-y-6 pb-12">

        {/* ── Header ──────────────────────────────────────────────────── */}
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
                <span className="text-xs font-semibold text-amber-700">{stats.pendingPayments} хүлээгдэж буй</span>
              </div>
            ) : null}
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-700">Систем ажиллаж байна</span>
            </div>
          </div>
        </div>

        {/* ── Top KPI row ──────────────────────────────────────────────── */}
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

        {/* ── Mini stats row ────────────────────────────────────────────── */}
        {!loading && stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MiniCard label="Дэд хичээл"   value={fmt(stats.subCourses)}       icon={Layers}        color="from-cyan-400 to-cyan-500" />
            <MiniCard label="Хичээл"        value={fmt(stats.lessons)}           icon={FileVideo}     color="from-indigo-400 to-indigo-500" />
            <MiniCard label="Хүлээгдэж буй" value={stats.pendingPayments}        icon={ShoppingCart}  color="from-amber-400 to-amber-500" />
            <MiniCard label="Нийт элсэгч"   value={fmt(stats.totalEnrollments)}  icon={GraduationCap} color="from-pink-400 to-pink-500" />
          </div>
        )}

        {/* ── Finance summary row ───────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold opacity-80">{MONTHS_MN[chartMonth - 1]} орлого</p>
              <DollarSign className="w-4 h-4 opacity-60" />
            </div>
            <p className="text-2xl font-bold tracking-tight">₮{fmt(displayRevenue)}</p>
            {stats && <p className="text-[11px] opacity-70 mt-1">Нийт: ₮{fmt(stats.totalRevenue)}</p>}
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 text-white shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold opacity-80">{MONTHS_MN[chartMonth - 1]} зарлага</p>
              <button onClick={() => setShowAddExp(true)}
                className="w-6 h-6 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                title="Зарлага нэмэх">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-2xl font-bold tracking-tight">₮{fmt(displayExpenses)}</p>
            <p className="text-[11px] opacity-70 mt-1">{expenses.length} бичилт</p>
          </div>
          <div className={`bg-gradient-to-br rounded-2xl p-5 text-white shadow-sm ${displayProfit >= 0 ? "from-emerald-500 to-emerald-600" : "from-red-500 to-red-600"}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold opacity-80">{MONTHS_MN[chartMonth - 1]} ашиг</p>
              {displayProfit >= 0 ? <TrendingUp className="w-4 h-4 opacity-60" /> : <TrendingDown className="w-4 h-4 opacity-60" />}
            </div>
            <p className="text-2xl font-bold tracking-tight">₮{fmt(Math.abs(displayProfit))}</p>
            <p className="text-[11px] opacity-70 mt-1">{displayProfit >= 0 ? "Ашигтай" : "Алдагдалтай"}</p>
          </div>
        </div>

        {/* ── Chart + Activity ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Chart panel */}
          <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700">
                  {chartMode === "monthly" ? "Орлого & элсэлт — Сүүлийн 6 сар" : `${chartYear} оны ${MONTHS_MN[chartMonth - 1]} — Өдрийн задаргаа`}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {chartMode === "monthly" ? "Сарын нийт дүн" : "Орлого · Зарлага · Ашиг"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {chartMode === "daily" && (
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                    <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white transition-colors">
                      <ChevronLeft className="w-4 h-4 text-gray-600" />
                    </button>
                    <span className="text-xs font-semibold text-gray-700 px-1 min-w-[72px] text-center">
                      {chartYear}/{String(chartMonth).padStart(2, "0")}
                    </span>
                    <button onClick={nextMonth} disabled={!canGoNext}
                      className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white transition-colors disabled:opacity-30">
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                )}
                <div className="flex items-center bg-gray-100 rounded-lg p-0.5 text-xs font-semibold">
                  <button onClick={() => setChartMode("monthly")}
                    className={`px-3 py-1 rounded-md transition-all ${chartMode === "monthly" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500"}`}>
                    Сарын
                  </button>
                  <button onClick={() => { setChartMode("daily"); fetchDailyAndExpenses(chartYear, chartMonth) }}
                    className={`px-3 py-1 rounded-md transition-all ${chartMode === "daily" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500"}`}>
                    Өдрийн
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />Орлого</span>
              {chartMode === "daily" ? (
                <>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block" />Зарлага</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />Ашиг</span>
                </>
              ) : (
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-violet-400 inline-block" />Элсэлт</span>
              )}
            </div>

            {loading || (chartMode === "daily" && dailyLoading) ? (
              <Skeleton className="h-48 w-full rounded-xl" />
            ) : chartMode === "monthly" ? (
              stats?.revenueByMonth?.length ? (
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
                    <Tooltip content={<MonthlyTooltip />} />
                    <Area yAxisId="rev" type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#revGrad)" dot={{ r: 3, fill: "#3b82f6" }} />
                    <Area yAxisId="enr" type="monotone" dataKey="enrollments" stroke="#a78bfa" strokeWidth={2} fill="url(#enrGrad)" dot={{ r: 3, fill: "#a78bfa" }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-300 text-sm">Өгөгдөл байхгүй</div>
              )
            ) : (
              dailyData.length ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={dailyData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="dRevGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="dExpGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="dProfGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false}
                      interval={Math.floor(dailyData.length / 8)} />
                    <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false}
                      tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}к` : String(v)} />
                    <Tooltip content={<DailyTooltip />} />
                    <Area type="monotone" dataKey="revenue"  stroke="#3b82f6" strokeWidth={2} fill="url(#dRevGrad)"  dot={false} />
                    <Area type="monotone" dataKey="expenses" stroke="#f97316" strokeWidth={2} fill="url(#dExpGrad)" dot={false} />
                    <Area type="monotone" dataKey="profit"   stroke="#10b981" strokeWidth={2} fill="url(#dProfGrad)"  dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-300 text-sm">Өгөгдөл байхгүй</div>
              )
            )}
          </div>

          {/* Activity panel */}
          <ActivityPanel activities={activities} onNav={nav} />
        </div>

        {/* ── Expenses panel ───────────────────────────────────────────── */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-orange-500" />
              {MONTHS_MN[chartMonth - 1]} зарлагууд
              {expenses.length > 0 && (
                <span className="bg-orange-100 text-orange-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1">
                  {expenses.length}
                </span>
              )}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Нийт: <span className="font-semibold text-orange-600">₮{fmt(displayExpenses)}</span></span>
              <button onClick={() => setShowAddExp(true)}
                className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                <Plus className="w-3.5 h-3.5" /> Нэмэх
              </button>
            </div>
          </div>

          {expLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
          ) : expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-300">
              <Receipt className="w-8 h-8 mb-2" />
              <p className="text-sm">Энэ сард зарлага байхгүй байна</p>
              <button onClick={() => setShowAddExp(true)}
                className="mt-3 text-xs text-orange-500 hover:underline font-semibold">+ Зарлага нэмэх</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 border-b border-gray-100">
                    <th className="text-left pb-2 font-medium">Огноо</th>
                    <th className="text-left pb-2 font-medium">Тайлбар</th>
                    <th className="text-left pb-2 font-medium">Ангилал</th>
                    <th className="text-right pb-2 font-medium">Дүн</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {expenses.map(exp => (
                    <tr key={exp._id} className="group hover:bg-gray-50 transition-colors">
                      <td className="py-2.5 text-gray-500 text-xs whitespace-nowrap">
                        {new Date(exp.date).toLocaleDateString("mn-MN", { month: "2-digit", day: "2-digit" })}
                      </td>
                      <td className="py-2.5 text-gray-800 font-medium max-w-[200px] truncate pr-2">{exp.description}</td>
                      <td className="py-2.5">
                        <span className="bg-orange-50 text-orange-600 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-semibold text-gray-800 whitespace-nowrap">
                        ₮{fmt(exp.amount)}
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => handleDeleteExpense(exp._id)}
                          disabled={deletingId === exp._id}
                          className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-all disabled:opacity-40 ml-auto">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Bottom row: Top courses + quick nav ──────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

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
    </>
  )
}
