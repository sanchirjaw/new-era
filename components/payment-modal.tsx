"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Loader2, RefreshCw, CheckCircle, ExternalLink } from "lucide-react"
import type { Course } from "@/lib/types"
import { useAuth } from "@/lib/hooks/useAuth"

interface PaymentModalProps {
  course: Course
  onClose: () => void
}

interface QPayInvoice {
  invoice_id: string
  qr_image: string
  qr_text: string
  urls: Array<{ name: string; description: string; logo: string; link: string }>
}

interface BylInvoice {
  id: number
  number: string
  url: string
  status: string
}

export function PaymentModal({ course, onClose }: PaymentModalProps) {
  const { user } = useAuth()
  const [method, setMethod] = useState<"qpay" | "bank">("qpay")

  // Shared
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [paymentDone, setPaymentDone] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // QPay
  const [qpayLoading, setQpayLoading] = useState(false)
  const [qpayInvoice, setQpayInvoice] = useState<QPayInvoice | null>(null)
  const qpayCreatingRef = useRef(false)

  // Bank (Byl invoice)
  const [bankLoading, setBankLoading] = useState(false)
  const [bylInvoice, setBylInvoice] = useState<BylInvoice | null>(null)
  const bankCreatingRef = useRef(false)

  // Cleanup polling on unmount
  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current) }, [])

  // Auto-create when tab selected
  useEffect(() => {
    if (method === "qpay" && !qpayInvoice && !paymentDone) createQPay()
  }, [method])

  useEffect(() => {
    if (method === "bank" && !bylInvoice && !paymentDone) createBylInvoice()
  }, [method])

  /* ── QPay ── */
  const createQPay = async () => {
    if (qpayCreatingRef.current) return
    qpayCreatingRef.current = true
    setQpayLoading(true)
    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: course._id }),
      })
      if (res.ok) {
        const data = await res.json()
        setQpayInvoice(data.qpayInvoice)
        setPaymentId(data.paymentId)
        startPolling(data.paymentId)
      } else {
        const err = await res.json()
        alert(err.error || "QPay invoice үүсгэхэд алдаа гарлаа")
      }
    } catch {
      alert("QPay invoice үүсгэхэд алдаа гарлаа")
    } finally {
      setQpayLoading(false)
      qpayCreatingRef.current = false
    }
  }

  /* ── Byl invoice (банк шилжүүлэг) ── */
  const createBylInvoice = async () => {
    if (bankCreatingRef.current) return
    bankCreatingRef.current = true
    setBankLoading(true)
    try {
      const res = await fetch("/api/payments/byl/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: course._id, paymentMethod: "invoice" }),
      })
      if (res.ok) {
        const data = await res.json()
        setBylInvoice(data.bylInvoice)
        setPaymentId(data.paymentId)
        startPolling(data.paymentId)
      } else {
        const err = await res.json()
        alert(err.error || "Invoice үүсгэхэд алдаа гарлаа")
      }
    } catch {
      alert("Invoice үүсгэхэд алдаа гарлаа")
    } finally {
      setBankLoading(false)
      bankCreatingRef.current = false
    }
  }

  /* ── Shared polling ── */
  const startPolling = (pid: string) => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    let count = 0
    intervalRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/payments/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ paymentId: pid }),
        })
        if (res.ok) {
          const data = await res.json()
          if (data.status === "completed") {
            clearInterval(intervalRef.current!)
            setPaymentDone(true)
            setTimeout(() => {
              onClose()
              window.location.href = window.location.pathname + "?payment_success=true&t=" + Date.now()
            }, 1500)
          }
        }
      } catch {}
      count++
      if (count >= 120) clearInterval(intervalRef.current!) // 6 min max
    }, 3000)
  }

  /* ── Success state ── */
  if (paymentDone) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-8 pb-6 text-center space-y-3">
            <CheckCircle className="w-14 h-14 text-green-500 mx-auto" />
            <p className="text-lg font-bold text-green-700">Төлбөр амжилттай!</p>
            <p className="text-sm text-gray-500">Хичээлд бүртгэж байна...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg">Төлбөр төлөлт</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Course + price */}
          <div className="text-center">
            <p className="font-semibold text-base">{course.title}</p>
            <p className="text-2xl font-black text-primary mt-1">₮{course.price.toLocaleString()}</p>
          </div>

          {/* Method tabs */}
          <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setMethod("qpay")}
              className={`py-2 rounded-lg text-sm font-semibold transition-all ${method === "qpay" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
            >
              📱 QPay
            </button>
            <button
              onClick={() => setMethod("bank")}
              className={`py-2 rounded-lg text-sm font-semibold transition-all ${method === "bank" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
            >
              🏦 Банк шилжүүлэг
            </button>
          </div>

          {/* ── QPay ── */}
          {method === "qpay" && (
            <div className="space-y-4">
              {qpayLoading ? (
                <div className="text-center py-8 space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                  <p className="text-sm text-gray-500">QPay invoice үүсгэж байна...</p>
                </div>
              ) : qpayInvoice ? (
                <div className="space-y-4">
                  {/* QR code */}
                  {qpayInvoice.qr_image && (
                    <div className="flex justify-center">
                      <img
                        src={`data:image/png;base64,${qpayInvoice.qr_image}`}
                        alt="QPay QR"
                        className="w-48 h-48 rounded-lg border"
                      />
                    </div>
                  )}
                  <p className="text-center text-sm text-gray-500">
                    Банкны апп-аараа QR кодыг уншуулна уу
                  </p>

                  {/* Bank app deep links */}
                  {qpayInvoice.urls && qpayInvoice.urls.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-500 text-center">Эсвэл аппаа сонгоно уу</p>
                      <div className="grid grid-cols-3 gap-2">
                        {qpayInvoice.urls.slice(0, 6).map((u) => (
                          <a
                            key={u.name}
                            href={u.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col items-center gap-1 p-2 rounded-lg border border-gray-100 hover:border-primary/40 hover:bg-primary/5 transition-colors"
                          >
                            {u.logo && (
                              <img src={u.logo} alt={u.name} className="w-8 h-8 rounded-md object-cover" />
                            )}
                            <span className="text-[10px] text-gray-600 text-center leading-tight">{u.name}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Төлбөр хүлээж байна...</span>
                  </div>

                  <button
                    onClick={() => { setQpayInvoice(null); qpayCreatingRef.current = false; createQPay() }}
                    className="w-full flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-gray-600 py-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Шинэ QR үүсгэх
                  </button>
                </div>
              ) : (
                <Button onClick={createQPay} className="w-full" size="lg">
                  QPay invoice үүсгэх
                </Button>
              )}
            </div>
          )}

          {/* ── Bank transfer (Byl invoice) ── */}
          {method === "bank" && (
            <div className="space-y-4">
              {bankLoading ? (
                <div className="text-center py-8 space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                  <p className="text-sm text-gray-500">Нэхэмжлэл үүсгэж байна...</p>
                </div>
              ) : bylInvoice ? (
                <div className="space-y-4">
                  {/* Reference number — main info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-500 font-medium">Дүн</span>
                      <span className="font-black text-blue-900 text-base">₮{course.price.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-blue-100 pt-3">
                      <p className="text-blue-500 font-medium mb-1">Гүйлгээний утга (заавал)</p>
                      <div className="bg-white rounded-lg px-3 py-2 font-mono font-bold text-blue-900 text-base tracking-wider border border-blue-200 text-center select-all">
                        {bylInvoice.number}
                      </div>
                      <p className="text-xs text-blue-400 mt-1 text-center">Дарж хуулах боломжтой</p>
                    </div>
                  </div>

                  {/* Byl payment page link */}
                  {bylInvoice.url && (
                    <a
                      href={bylInvoice.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Нэхэмжлэлийн хуудас харах
                    </a>
                  )}

                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700 text-center">
                    Дээрх утгыг гүйлгээний утганд бичиж банкаар шилжүүлнэ үү.<br />
                    Шилжүүлэг баталгаажсаны дараа <strong>автоматаар</strong> элсэлт нэмэгдэнэ.
                  </div>

                  <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Шилжүүлэг хүлээж байна...</span>
                  </div>

                  <button
                    onClick={() => { setBylInvoice(null); bankCreatingRef.current = false; createBylInvoice() }}
                    className="w-full flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-gray-600 py-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Шинэ нэхэмжлэл үүсгэх
                  </button>
                </div>
              ) : (
                <Button onClick={createBylInvoice} className="w-full" size="lg">
                  Нэхэмжлэл үүсгэх
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
