"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Loader2, RefreshCw, CheckCircle } from "lucide-react"
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

export function PaymentModal({ course, onClose }: PaymentModalProps) {
  const { user } = useAuth()
  const [method, setMethod] = useState<"qpay" | "bank">("qpay")

  // QPay state
  const [qpayLoading, setQpayLoading] = useState(false)
  const [qpayInvoice, setQpayInvoice] = useState<QPayInvoice | null>(null)
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [paymentDone, setPaymentDone] = useState(false)
  const creatingRef = useRef(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Bank transfer state
  const [bankLoading, setBankLoading] = useState(false)
  const [bankCreated, setBankCreated] = useState(false)
  const [bankRef, setBankRef] = useState("")

  // Cleanup interval on unmount
  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current) }, [])

  // Auto-create QPay invoice when modal opens
  useEffect(() => {
    if (method === "qpay" && !qpayInvoice && !paymentDone) createQPay()
  }, [method])

  const createQPay = async () => {
    if (creatingRef.current) return
    creatingRef.current = true
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
      creatingRef.current = false
    }
  }

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
            }, 1200)
          }
        }
      } catch {}
      count++
      if (count >= 60) clearInterval(intervalRef.current!)
    }, 3000)
  }

  const createBankTransfer = async () => {
    setBankLoading(true)
    try {
      const res = await fetch("/api/payments/bank-transfer/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: course._id }),
      })
      if (res.ok) {
        const data = await res.json()
        setBankRef(data.reference || "")
        setBankCreated(true)
      } else {
        const err = await res.json()
        alert(err.error || "Төлбөр бүртгэхэд алдаа гарлаа")
      }
    } catch {
      alert("Төлбөр бүртгэхэд алдаа гарлаа")
    } finally {
      setBankLoading(false)
    }
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
              {paymentDone ? (
                <div className="text-center py-6 space-y-2">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                  <p className="font-semibold text-green-700">Төлбөр амжилттай!</p>
                  <p className="text-sm text-gray-500">Хичээлд бүртгэж байна...</p>
                </div>
              ) : qpayLoading ? (
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
                    onClick={() => { setQpayInvoice(null); creatingRef.current = false; createQPay() }}
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

          {/* ── Bank transfer ── */}
          {method === "bank" && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-500">Банк</span>
                  <span className="font-semibold text-blue-900">TDB (Худалдаа хөгжлийн банк)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-500">Дансны дугаар</span>
                  <span className="font-mono font-semibold text-blue-900">MN970004000418067243</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-500">Дүн</span>
                  <span className="font-bold text-blue-900">₮{course.price.toLocaleString()}</span>
                </div>
              </div>

              <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-sm space-y-1">
                <p className="font-semibold text-green-800">Гүйлгээний утга:</p>
                <div className="bg-white rounded-lg px-3 py-2 font-mono text-sm border">
                  {user?.name} - {user?.email} - {course.title}
                </div>
                <p className="text-xs text-green-600">Дээрх мэдээллийг гүйлгээний утганд заавал бичнэ үү</p>
              </div>

              <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 text-sm text-center">
                <p className="text-orange-700 font-semibold mb-1">Шилжүүлсний дараа залгана уу</p>
                <p className="text-2xl font-black text-orange-600">99638369</p>
              </div>

              {bankCreated ? (
                <div className="w-full bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-green-700 text-sm font-medium text-center">
                  ✓ Төлбөр бүртгэгдлээ — шилжүүлсний дараа утас руу залгана уу
                </div>
              ) : (
                <Button
                  onClick={createBankTransfer}
                  disabled={bankLoading}
                  className="w-full"
                  size="lg"
                >
                  {bankLoading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Бүртгэж байна...</>
                  ) : "Банк шилжүүлгийн төлбөр бүртгэх"}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
