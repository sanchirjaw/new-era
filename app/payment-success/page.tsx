"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Header } from "@/components/header"
import { CheckCircle } from "lucide-react"

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [paymentDetails, setPaymentDetails] = useState<any>(null)

  useEffect(() => {
    const paymentId = searchParams.get("paymentId")
    if (!paymentId) {
      router.push("/")
      return
    }

    const checkPayment = async () => {
      try {
        const response = await fetch("/api/payments/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId }),
        })

        if (response.ok) {
          const data = await response.json()
          setPaymentDetails(data.payment)
        }
      } catch (error) {
  
      } finally {
        setLoading(false)
      }
    }

    checkPayment()
  }, [searchParams, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="p-8 text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Төлбөр амжилттай!</h1>
                <p className="text-gray-600">Таны төлбөр амжилттай төлөгдөж, хичээлд бүртгэгдлээ.</p>
              </div>

              {paymentDetails && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span>Төлбөрийн дүн:</span>
                      <span className="font-medium">₮{paymentDetails.amount?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Төлөв:</span>
                      <span className="font-medium text-green-600">Амжилттай</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <Button asChild className="w-full bg-primary hover:bg-primary/90">
                  <Link href="/dashboard">Миний хичээллүүд</Link>
                </Button>
                <Button asChild variant="outline" className="w-full bg-transparent">
                  <Link href="/courses">Бусад хичээллүүд</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
