"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Loader2, ExternalLink } from "lucide-react"
import type { Course } from "@/lib/types"

interface PaymentModalProps {
  course: Course
  onClose: () => void
}

interface BylCheckout {
  id: number
  url: string
  status: string
  amount_total: number
}

export function PaymentModal({ course, onClose }: PaymentModalProps) {
  const [loading, setLoading] = useState(false)
  const [bylCheckout, setBylCheckout] = useState<BylCheckout | null>(null)
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<string>("pending")
  const [hasRedirected, setHasRedirected] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"byl" | "bank_transfer">("byl")
  const [bankTransferData, setBankTransferData] = useState<any>(null)

  // Automatically create Byl payment when modal opens and byl is selected
  useEffect(() => {
    if (selectedPaymentMethod === "byl" && !bylCheckout && !hasRedirected) {
      createBylPayment()
    }
  }, [selectedPaymentMethod])

  const createBylPayment = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/payments/byl/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course._id,
          paymentMethod: "checkout"
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setBylCheckout(data.bylCheckout)
        setPaymentId(data.paymentId)
        setHasRedirected(true)
        // Automatically redirect to Byl payment page
        window.open(data.bylCheckout.url, "_blank")
        startPaymentCheck(data.paymentId)
      } else {
        const error = await response.json()
        alert(error.error || "Төлбөр үүсгэхэд алдаа гарлаа")
      }
    } catch (error) {
      console.error("Payment error:", error)
      alert("Төлбөр үүсгэхэд алдаа гарлаа")
    } finally {
      setLoading(false)
    }
  }

  const startPaymentCheck = (paymentId: string) => {
    let checkCount = 0
    const maxChecks = 120 // 2 minutes max (120 * 1000ms)

    const checkInterval = setInterval(async () => {
      try {
        const response = await fetch("/api/payments/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId }),
        })

        if (response.ok) {
          const data = await response.json()
          setPaymentStatus(data.status)

          if (data.status === "completed") {
            clearInterval(checkInterval)
            alert("Төлбөр амжилттай төлөгдлөө! Хичээлд бүртгэгдлээ.")
            onClose()
            // Redirect immediately to show course access
            window.location.href = window.location.pathname + "?payment_success=true&t=" + Date.now()
          }
        }

        checkCount++
        if (checkCount >= maxChecks) {
          clearInterval(checkInterval)
        }
      } catch (error) {
        console.error("Payment check error:", error)
        checkCount++
        if (checkCount >= maxChecks) {
          clearInterval(checkInterval)
        }
      }
    }, 1000) // Check every 1 second instead of 3 seconds
  }

  const reopenPaymentPage = () => {
    if (bylCheckout) {
      window.open(bylCheckout.url, "_blank")
    }
  }

  const createBankTransferPayment = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/payments/bank-transfer/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course._id,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setPaymentId(data.paymentId)
        setBankTransferData(data)
        alert("Банкны шилжүүлгийн төлбөр үүсгэгдлээ. Төлбөр шилжүүлсний дараа утасны дугаар руу залгана уу.")
      } else {
        const error = await response.json()
        alert(error.error || "Төлбөр үүсгэхэд алдаа гарлаа")
      }
    } catch (error) {
      console.error("Payment error:", error)
      alert("Төлбөр үүсгэхэд алдаа гарлаа")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Төлбөр төлөлт</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <h3 className="font-semibold text-lg mb-2">{course.title}</h3>
            <div className="text-2xl font-bold text-primary mt-2">₮{course.price.toLocaleString()}</div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-3">
            <h4 className="font-medium text-center">Төлбөрийн арга сонгох</h4>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={selectedPaymentMethod === "byl" ? "default" : "outline"}
                onClick={() => setSelectedPaymentMethod("byl")}
                className="w-full"
              >
                Онлайн төлбөр
              </Button>
              <Button
                variant={selectedPaymentMethod === "bank_transfer" ? "default" : "outline"}
                onClick={() => setSelectedPaymentMethod("bank_transfer")}
                className="w-full"
              >
                Банк шилжүүлэг
              </Button>
            </div>
          </div>

          {/* Payment Content */}
          {selectedPaymentMethod === "byl" && (
            <>
              {loading ? (
                <div className="text-center space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                  <p>Төлбөр үүсгэж байна...</p>
                </div>
              ) : bylCheckout ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <h4 className="font-medium text-lg mb-2">Byl төлбөрийн хуудас</h4>
                    <div className="text-sm text-gray-600 mb-4">
                      {paymentStatus === "completed"
                        ? "Төлбөр амжилттай төлөгдлөө!"
                        : "Төлбөрийн хуудас нээгдлээ. Хэрэв автоматаар нээгдээгүй бол доорх товчлуурыг дарна уу."}
                    </div>
                  </div>

                  <div className="text-center space-y-3">
                    <Button
                      onClick={reopenPaymentPage}
                      className="w-full bg-primary hover:bg-primary/90"
                      size="lg"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Төлбөрийн хуудас нээх
                    </Button>

                    <Button
                      onClick={createBylPayment}
                      variant="outline"
                      className="w-full"
                    >
                      Шинэ төлбөр үүсгэх
                    </Button>
                  </div>

                  {paymentStatus === "pending" && (
                    <div className="text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Төлбөр хүлээж байна...</p>
                      <p className="text-xs text-gray-500 mt-1">Төлбөр баталгаажсан даруй хичээлд бүртгэгдэх болно</p>
                    </div>
                  )}

                  <div className="text-center text-sm text-gray-600">
                    <p>Төлбөр төлөгдсөний дараа автоматаар хичээлд бүртгэгдэх болно.</p>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <Button
                    onClick={createBylPayment}
                    disabled={loading}
                    className="w-full bg-primary hover:bg-primary/90"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Төлбөр үүсгэж байна...
                      </>
                    ) : (
                      "Онлайн төлбөр төлөх"
                    )}
                  </Button>
                </div>
              )}
            </>
          )}

          {selectedPaymentMethod === "bank_transfer" && (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">Банкны мэдээлэл</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-600 dark:text-blue-300">Банк:</span>
                    <span className="font-medium text-blue-800 dark:text-blue-200">TDB (Худалдаа хөгжлийн банк)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600 dark:text-blue-300">Данс:</span>
                    <span className="font-mono font-medium text-blue-800 dark:text-blue-200">MN970004000418067243</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600 dark:text-blue-300">Дүн:</span>
                    <span className="font-bold text-blue-800 dark:text-blue-200">₮{course.price.toLocaleString()}</span>
                  </div>
                  {bankTransferData?.reference && (
                    <div className="flex justify-between">
                      <span className="text-blue-600 dark:text-blue-300">Лавлагаа:</span>
                      <span className="font-mono font-medium text-blue-800 dark:text-blue-200">{bankTransferData.reference}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800 mb-4">
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">Гүйлгээний утга:</h4>
                <div className="text-sm text-green-700 dark:text-green-300 mb-2">
                  <p className="mb-2">Гүйлгээ хийхдээ дараах мэдээллийг <strong>заавал</strong> бичнэ үү:</p>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border font-mono text-sm">
                    {user?.name} - {user?.email} - {course.title}
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">Төлбөр шилжүүлсний дараа:</h4>
                <div className="text-sm text-orange-700 dark:text-orange-300">
                  <p className="mb-2">Төлбөр шилжүүлсний дараа доорх утасны дугаар руу залгаж баталгаажуулна уу:</p>
                  <div className="flex items-center justify-center bg-orange-100 dark:bg-orange-800/50 p-3 rounded-lg">
                    <span className="text-lg font-bold text-orange-800 dark:text-orange-200">99638369</span>
                  </div>
                  <p className="mt-2 text-xs">Гүйлгээний утганд нэр, имэйл заавал бичсэн эсэхийг шалгана уу!</p>
                </div>
              </div>

              <div className="text-center space-y-3">
                <Button
                  onClick={createBankTransferPayment}
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Төлбөр бүртгэж байна...
                    </>
                  ) : (
                    "Банк шилжүүлгийн төлбөр бүртгэх"
                  )}
                </Button>
              </div>

              <div className="text-center text-sm text-gray-600">
                <p>Банк шилжүүлэг хийсний дараа утасны дугаар руу залгаж баталгаажуулсны дараа хичээлд бүртгэгдэх болно.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
