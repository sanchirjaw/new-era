"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  RefreshCw, Search, CheckCircle, Clock, AlertTriangle,
  DollarSign, ChevronLeft, ChevronRight, Calendar, List,
  ArrowLeft, TrendingUp, CreditCard, Banknote,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface Payment {
  _id: string
  userId: string
  courseId: string
  amount: number
  status: "pending" | "completed" | "failed" | "refunded"
  paymentMethod: "qpay" | "byl" | "bank_transfer"
  bankTransferReference?: string
  createdAt: string
  user?: { name: string; email: string }
  course?: { title: string }
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const MONTHS_MN = ["1-р сар","2-р сар","3-р сар","4-р сар","5-р сар","6-р сар",
                   "7-р сар","8-р сар","9-р сар","10-р сар","11-р сар","12-р сар"]
const WEEKDAYS  = ["Да","Мя","Лх","Пү","Ба","Бя","Ня"]

function fmt(n: number) { return n.toLocaleString("mn-MN") }

function dayKey(d: string) {
  const dt = new Date(d)
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`
}

function displayDay(key: string) {
  const [y,m,d] = key.split("-")
  const dt = new Date(+y, +m-1, +d)
  return { y, m, d, weekday: WEEKDAYS[dt.getDay()] }
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    completed: "bg-emerald-100 text-emerald-700",
    pending:   "bg-amber-100 text-amber-700",
    failed:    "bg-red-100 text-red-600",
    refunded:  "bg-gray-100 text-gray-600",
  }
  const label: Record<string, string> = {
    completed: "Амжилттай", pending: "Хүлээгдэж буй",
    failed: "Амжилтгүй", refunded: "Буцаагдсан",
  }
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[status] ?? "bg-gray-100 text-gray-600"}`}>{label[status] ?? status}</span>
}

function MethodBadge({ method }: { method: string }) {
  const map: Record<string, string> = {
    qpay: "bg-blue-100 text-blue-700",
    byl:  "bg-violet-100 text-violet-700",
    bank_transfer: "bg-teal-100 text-teal-700",
  }
  const label: Record<string, string> = { qpay: "QPay", byl: "Byl", bank_transfer: "Банк" }
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[method] ?? "bg-gray-100 text-gray-600"}`}>{label[method] ?? method}</span>
}

function StatusIcon({ status }: { status: string }) {
  if (status === "completed") return <CheckCircle className="w-4 h-4 text-emerald-500" />
  if (status === "pending")   return <Clock       className="w-4 h-4 text-amber-400" />
  if (status === "failed")    return <AlertTriangle className="w-4 h-4 text-red-400" />
  return <DollarSign className="w-4 h-4 text-gray-400" />
}

/* ─── Main ───────────────────────────────────────────────────────────────── */
export default function AdminPayments() {
  const router = useRouter()
  const { toast } = useToast()

  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // View state
  const now = new Date()
  const [viewYear,  setViewYear]  = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth()) // 0-indexed
  const [mode, setMode]           = useState<"monthly" | "daily">("monthly")
  const [selectedDay, setSelectedDay] = useState<string | null>(null) // "YYYY-MM-DD"

  // Filters (only active in daily detail mode)
  const [search, setSearch]     = useState("")
  const [statusF, setStatusF]   = useState("all")
  const [methodF, setMethodF]   = useState("all")

  useEffect(() => { checkAuth() }, [])

  const checkAuth = async () => {
    try {
      const r = await fetch("/api/admin/check", { credentials: "include" })
      if (!r.ok) { router.push("/admin/login"); return }
      const d = await r.json()
      if (d.user.role !== "admin") { router.push("/admin/login"); return }
      loadPayments()
    } catch { router.push("/admin/login") }
  }

  const loadPayments = async () => {
    try {
      const r = await fetch("/api/admin/payments", { credentials: "include" })
      if (r.ok) {
        const d = await r.json()
        setPayments(d.payments || [])
      } else toast({ title: "Алдаа", description: "Төлбөр ачаалахад алдаа гарлаа", variant: "destructive" })
    } catch { toast({ title: "Алдаа", description: "Сүлжээний алдаа", variant: "destructive" }) }
    finally { setLoading(false); setRefreshing(false) }
  }

  const handleRefresh = () => { setRefreshing(true); loadPayments() }

  const confirmBank = async (paymentId: string, ref?: string) => {
    const r = await fetch("/api/payments/bank-transfer/confirm", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId, transactionReference: ref }),
    })
    if (r.ok) { toast({ title: "Амжилттай", description: "Төлбөр баталгаажлаа" }); loadPayments() }
    else { const e = await r.json(); toast({ title: "Алдаа", description: e.error, variant: "destructive" }) }
  }

  /* ── Month navigation ─────────────────────────────────────────────────── */
  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
    setSelectedDay(null); setMode("monthly")
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
    setSelectedDay(null); setMode("monthly")
  }
  const goToday = () => { setViewYear(now.getFullYear()); setViewMonth(now.getMonth()); setSelectedDay(null); setMode("monthly") }

  /* ── Filtered to current month ────────────────────────────────────────── */
  const monthPayments = useMemo(() => payments.filter(p => {
    const d = new Date(p.createdAt)
    return d.getFullYear() === viewYear && d.getMonth() === viewMonth
  }), [payments, viewYear, viewMonth])

  /* ── Month stats ──────────────────────────────────────────────────────── */
  const monthStats = useMemo(() => {
    const completed = monthPayments.filter(p => p.status === "completed")
    return {
      total: monthPayments.length,
      revenue: completed.reduce((s, p) => s + p.amount, 0),
      successful: completed.length,
      pending: monthPayments.filter(p => p.status === "pending").length,
      failed: monthPayments.filter(p => p.status === "failed").length,
    }
  }, [monthPayments])

  /* ── Group by day ─────────────────────────────────────────────────────── */
  const byDay = useMemo(() => {
    const map: Record<string, Payment[]> = {}
    for (const p of monthPayments) {
      const k = dayKey(p.createdAt)
      if (!map[k]) map[k] = []
      map[k].push(p)
    }
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]))
  }, [monthPayments])

  /* ── Daily detail payments ────────────────────────────────────────────── */
  const detailPayments = useMemo(() => {
    const base = selectedDay ? (byDay.find(([k]) => k === selectedDay)?.[1] ?? []) : monthPayments
    return base.filter(p =>
      (statusF === "all" || p.status === statusF) &&
      (methodF === "all" || p.paymentMethod === methodF) &&
      (!search || p.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
        p.course?.title?.toLowerCase().includes(search.toLowerCase()))
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [selectedDay, byDay, monthPayments, statusF, methodF, search])

  /* ── Today indicator ─────────────────────────────────────────────────── */
  const todayKey = dayKey(now.toISOString())
  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth()

  /* ── Loading ──────────────────────────────────────────────────────────── */
  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
    </div>
  )

  /* ── Render ───────────────────────────────────────────────────────────── */
  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-12">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Төлбөрүүд</h1>
          <p className="text-sm text-gray-400 mt-0.5">Орлогын дэлгэрэнгүй мэдээлэл</p>
        </div>
        <button onClick={handleRefresh} disabled={refreshing}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm transition-colors">
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} /> Шинэчлэх
        </button>
      </div>

      {/* ── Month KPI bar ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Нийт гүйлгээ",   value: monthStats.total,           color: "text-gray-800",    icon: CreditCard,     bg: "bg-gray-50" },
          { label: "Орлого",          value: `₮${fmt(monthStats.revenue)}`, color: "text-blue-700", icon: DollarSign,     bg: "bg-blue-50" },
          { label: "Амжилттай",       value: monthStats.successful,      color: "text-emerald-700", icon: CheckCircle,    bg: "bg-emerald-50" },
          { label: "Хүлээгдэж буй",   value: monthStats.pending,         color: "text-amber-700",   icon: Clock,          bg: "bg-amber-50" },
          { label: "Амжилтгүй",       value: monthStats.failed,          color: "text-red-600",     icon: AlertTriangle,  bg: "bg-red-50" },
        ].map(({ label, value, color, icon: Icon, bg }) => (
          <div key={label} className={`${bg} rounded-2xl border border-white/60 p-4 shadow-sm`}>
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`w-3.5 h-3.5 ${color}`} />
              <p className="text-xs text-gray-500">{label}</p>
            </div>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Month nav + view toggle ──────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Month navigation */}
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="w-8 h-8 rounded-lg border border-gray-200 bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors">
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div className="min-w-[160px] text-center">
            <span className="text-base font-bold text-gray-800">{viewYear} оны {MONTHS_MN[viewMonth]}</span>
          </div>
          <button onClick={nextMonth} className="w-8 h-8 rounded-lg border border-gray-200 bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors">
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
          {!isCurrentMonth && (
            <button onClick={goToday} className="text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
              Өнөөдөр
            </button>
          )}
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => { setMode("monthly"); setSelectedDay(null) }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${mode === "monthly" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            <Calendar className="w-3.5 h-3.5" /> Сарын харагдац
          </button>
          <button
            onClick={() => setMode("daily")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${mode === "daily" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            <List className="w-3.5 h-3.5" /> Жагсаалт
          </button>
        </div>
      </div>

      {/* ── MONTHLY VIEW ─────────────────────────────────────────────────── */}
      {mode === "monthly" && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-x-auto">
          {byDay.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-300">
              <Calendar className="w-12 h-12 mb-3" />
              <p className="text-sm font-medium">Энэ сард гүйлгээ байхгүй</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left text-xs font-semibold text-gray-400 px-5 py-3">Огноо</th>
                  <th className="text-right text-xs font-semibold text-gray-400 px-4 py-3">Гүйлгээ</th>
                  <th className="text-right text-xs font-semibold text-gray-400 px-4 py-3">Орлого</th>
                  <th className="text-right text-xs font-semibold text-gray-400 px-4 py-3">Амжилттай</th>
                  <th className="text-right text-xs font-semibold text-gray-400 px-4 py-3">Хүлээгдэж буй</th>
                  <th className="text-right text-xs font-semibold text-gray-400 px-4 py-3">Амжилтгүй</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {byDay.map(([key, ps]) => {
                  const { y, m, d, weekday } = displayDay(key)
                  const rev = ps.filter(p => p.status === "completed").reduce((s, p) => s + p.amount, 0)
                  const ok  = ps.filter(p => p.status === "completed").length
                  const pend= ps.filter(p => p.status === "pending").length
                  const fail= ps.filter(p => p.status === "failed").length
                  const isToday = key === todayKey
                  return (
                    <tr key={key}
                      onClick={() => { setSelectedDay(key); setMode("daily") }}
                      className="border-b border-gray-50 last:border-0 hover:bg-blue-50/40 cursor-pointer transition-colors group"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex flex-col items-center justify-center shrink-0 font-bold ${isToday ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}>
                            <span className="text-sm leading-none">{d}</span>
                            <span className={`text-[9px] leading-none mt-0.5 ${isToday ? "text-blue-200" : "text-gray-400"}`}>{weekday}</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{y}/{m}/{d}</p>
                            {isToday && <span className="text-[10px] text-blue-500 font-semibold">Өнөөдөр</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="text-sm font-bold text-gray-800">{ps.length}</span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="text-sm font-bold text-blue-700">₮{fmt(rev)}</span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {ok > 0 ? <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{ok}</span> : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {pend > 0 ? <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{pend}</span> : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {fail > 0 ? <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">{fail}</span> : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 ml-auto transition-colors" />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50/80 border-t-2 border-gray-100">
                  <td className="px-5 py-3 text-xs font-bold text-gray-500">Нийт дүн</td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-gray-700">{monthStats.total}</td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-blue-700">₮{fmt(monthStats.revenue)}</td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-emerald-600">{monthStats.successful}</td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-amber-600">{monthStats.pending}</td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-red-500">{monthStats.failed}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      )}

      {/* ── DAILY / LIST VIEW ────────────────────────────────────────────── */}
      {mode === "daily" && (
        <div className="space-y-4">
          {/* Back + day info */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => { setMode("monthly"); setSelectedDay(null) }}
              className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Сарын харагдац руу буцах
            </button>
            {selectedDay && (() => {
              const { y, m, d, weekday } = displayDay(selectedDay)
              const dayPs = byDay.find(([k]) => k === selectedDay)?.[1] ?? []
              const dayRev = dayPs.filter(p => p.status === "completed").reduce((s, p) => s + p.amount, 0)
              return (
                <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 ml-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex flex-col items-center justify-center text-white shrink-0">
                    <span className="text-xs font-bold leading-none">{d}</span>
                    <span className="text-[9px] leading-none mt-0.5 text-blue-200">{weekday}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-blue-800">{y} оны {MONTHS_MN[+m-1]} {d}</p>
                    <p className="text-xs text-blue-500">{dayPs.length} гүйлгээ · ₮{fmt(dayRev)} орлого</p>
                  </div>
                  <button onClick={() => setSelectedDay(null)} className="ml-2 text-xs text-blue-400 hover:text-blue-600 font-medium">
                    Бүгдийг харах
                  </button>
                </div>
              )
            })()}
            {!selectedDay && (
              <span className="text-xs text-gray-400 ml-2">
                {viewYear} оны {MONTHS_MN[viewMonth]} — нийт {monthPayments.length} гүйлгээ
              </span>
            )}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" />
              <Input placeholder="Хэрэглэгч, курс хайх..." value={search}
                onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm border-gray-200" />
            </div>
            <Select value={statusF} onValueChange={setStatusF}>
              <SelectTrigger className="w-36 h-9 text-sm border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Бүх статус</SelectItem>
                <SelectItem value="completed">Амжилттай</SelectItem>
                <SelectItem value="pending">Хүлээгдэж буй</SelectItem>
                <SelectItem value="failed">Амжилтгүй</SelectItem>
                <SelectItem value="refunded">Буцаагдсан</SelectItem>
              </SelectContent>
            </Select>
            <Select value={methodF} onValueChange={setMethodF}>
              <SelectTrigger className="w-36 h-9 text-sm border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Бүх арга</SelectItem>
                <SelectItem value="qpay">QPay</SelectItem>
                <SelectItem value="byl">Byl</SelectItem>
                <SelectItem value="bank_transfer">Банк</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-gray-400 ml-auto">{detailPayments.length} үр дүн</span>
          </div>

          {/* Payment list */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            {detailPayments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-300">
                <List className="w-10 h-10 mb-2" />
                <p className="text-sm">Гүйлгээ байхгүй байна</p>
              </div>
            ) : (
              <div>
                {/* Group by day if showing all month */}
                {!selectedDay ? (
                  (() => {
                    const grouped: Record<string, Payment[]> = {}
                    for (const p of detailPayments) {
                      const k = dayKey(p.createdAt)
                      if (!grouped[k]) grouped[k] = []
                      grouped[k].push(p)
                    }
                    return Object.entries(grouped)
                      .sort(([a], [b]) => b.localeCompare(a))
                      .map(([key, ps]) => {
                        const { y, m, d, weekday } = displayDay(key)
                        const rev = ps.filter(p => p.status === "completed").reduce((s, p) => s + p.amount, 0)
                        return (
                          <div key={key}>
                            <div className="flex items-center gap-3 px-5 py-2.5 bg-gray-50/80 border-b border-gray-100 sticky top-0">
                              <div className={`w-7 h-7 rounded-lg flex flex-col items-center justify-center text-white text-[10px] font-bold shrink-0 ${key === todayKey ? "bg-blue-600" : "bg-gray-400"}`}>
                                {d}
                              </div>
                              <p className="text-xs font-bold text-gray-600">{y}/{m}/{d} {weekday} гараг</p>
                              <span className="text-xs text-gray-400">{ps.length} гүйлгээ</span>
                              <span className="text-xs font-semibold text-blue-600 ml-auto">₮{fmt(rev)}</span>
                            </div>
                            {ps.map(p => <PaymentRow key={p._id} payment={p} onConfirmBank={confirmBank} />)}
                          </div>
                        )
                      })
                  })()
                ) : (
                  detailPayments.map(p => <PaymentRow key={p._id} payment={p} onConfirmBank={confirmBank} />)
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Payment row ────────────────────────────────────────────────────────── */
function PaymentRow({ payment, onConfirmBank }: {
  payment: Payment
  onConfirmBank: (id: string, ref?: string) => void
}) {
  const time = new Date(payment.createdAt).toLocaleTimeString("mn-MN", { hour: "2-digit", minute: "2-digit" })
  return (
    <div className="flex items-center gap-4 px-5 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
      <div className="shrink-0"><StatusIcon status={payment.status} /></div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-gray-800">{payment.user?.name || "—"}</p>
          <span className="text-gray-300 text-xs">·</span>
          <p className="text-xs text-gray-400 truncate max-w-[200px]">{payment.course?.title || "—"}</p>
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <p className="text-[11px] text-gray-400">{payment.user?.email}</p>
          {payment.bankTransferReference && (
            <span className="text-[11px] text-gray-400">· Ref: {payment.bankTransferReference}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          <p className="text-sm font-bold text-gray-900">₮{payment.amount.toLocaleString()}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{time}</p>
        </div>
        <div className="flex flex-col gap-1 items-end">
          <StatusBadge status={payment.status} />
          <MethodBadge method={payment.paymentMethod} />
        </div>
        {payment.paymentMethod === "bank_transfer" && payment.status === "pending" && (
          <button
            onClick={() => onConfirmBank(payment._id, payment.bankTransferReference)}
            className="text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
          >
            <CheckCircle className="w-3.5 h-3.5" /> Баталгаажуулах
          </button>
        )}
      </div>
    </div>
  )
}
