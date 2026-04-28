"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RefreshCw, Download, Search, Eye, DollarSign, Clock, AlertTriangle, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Payment {
  _id: string
  userId: string
  courseId: string
  amount: number
  currency: string
  status: "pending" | "completed" | "failed" | "refunded"
  paymentMethod: "qpay" | "byl" | "bank_transfer"
  qpayInvoiceId?: string
  qpayTransactionId?: string
  bylInvoiceId?: number
  bylCheckoutId?: number
  bankTransferReference?: string
  createdAt: string
  user?: {
    name: string
    email: string
  }
  course?: {
    title: string
  }
}

interface PaymentStats {
  total: number
  successful: number
  pending: number
  failed: number
}

export default function AdminPayments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [methodFilter, setMethodFilter] = useState("all")
  const [stats, setStats] = useState<PaymentStats>({
    total: 0,
    successful: 0,
    pending: 0,
    failed: 0
  })
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/admin/check", {
        credentials: 'include'
      })
      if (!response.ok || response.status === 401) {
        router.push("/admin/login")
        return
      }

      const data = await response.json()
      if (data.user.role !== "admin") {
        router.push("/admin/login")
        return
      }

      fetchPayments()
    } catch (error) {

      router.push("/admin/login")
    }
  }

  const fetchPayments = async () => {
    try {
      const response = await fetch("/api/admin/payments")
      if (response.ok) {
        const data = await response.json()
        setPayments(data.payments)
        setStats(data.stats)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch payments",
          variant: "destructive"
        })
      }
    } catch (error) {

      toast({
        title: "Error",
        description: "Failed to fetch payments",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    setLoading(true)
    fetchPayments()
  }

  const handleExport = () => {
    // Export functionality would go here
    toast({
      title: "Export",
      description: "Export functionality coming soon"
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "failed":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Амжилттай</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Хүлээгдэж буй</Badge>
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Амжилтгүй</Badge>
      case "refunded":
        return <Badge className="bg-gray-100 text-gray-800">Буцаагдсан</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPaymentMethodBadge = (paymentMethod: string) => {
    switch (paymentMethod) {
      case "qpay":
        return <Badge className="bg-blue-100 text-blue-800">QPay</Badge>
      case "byl":
        return <Badge className="bg-purple-100 text-purple-800">Byl</Badge>
      case "bank_transfer":
        return <Badge className="bg-green-100 text-green-800">Банк шилжүүлэг</Badge>
      default:
        return <Badge variant="secondary">{paymentMethod}</Badge>
    }
  }

  const confirmBankTransfer = async (paymentId: string, reference?: string) => {
    try {
      const response = await fetch("/api/payments/bank-transfer/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId,
          transactionReference: reference
        }),
      })

      if (response.ok) {
        toast({
          title: "Амжилттай",
          description: "Банк шилжүүлгийн төлбөр баталгаажлаа",
        })
        fetchPayments() // Refresh the list
      } else {
        const error = await response.json()
        toast({
          title: "Алдаа",
          description: error.error || "Төлбөр баталгаажуулахад алдаа гарлаа",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Алдаа",
        description: "Төлбөр баталгаажуулахад алдаа гарлаа",
        variant: "destructive"
      })
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return "Today"
    if (diffInDays === 1) return "1 day ago"
    return `${diffInDays} days ago`
  }

  const filteredPayments = payments.filter(payment => {
    const matchesSearch =
      payment.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.course?.title?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || payment.status === statusFilter
    const matchesMethod = methodFilter === "all" || payment.paymentMethod === methodFilter

    return matchesSearch && matchesStatus && matchesMethod
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Төлбөрүүд</h1>
        <p className="text-gray-600">Системийн бүх төлбөрийн түүх ба удирдлага</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Нийт</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Амжилттай</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successful}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Хүлээгдэж буй</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Амжилтгүй</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Төлбөрүүд</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Bar */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Хэрэглэгч, курс хайх..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
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
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Бүх төрөл</SelectItem>
                <SelectItem value="qpay">QPay</SelectItem>
                <SelectItem value="byl">Byl</SelectItem>
                <SelectItem value="bank_transfer">Банк шилжүүлэг</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Шинэчлэх
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Экспорт
            </Button>
          </div>

          {/* Payments List */}
          <div className="space-y-4">
            {filteredPayments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No payments found</div>
            ) : (
              filteredPayments.map((payment) => (
                <div key={payment._id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(payment.status)}
                      <div>
                        <h3 className="font-medium">{payment.user?.name || "Unknown User"}</h3>
                        <p className="text-sm text-gray-500">{payment.course?.title || "Unknown Course"}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-gray-500">{formatTimeAgo(payment.createdAt)}</span>
                          <span className="text-sm text-gray-500">•</span>
                          <span className="text-sm text-gray-500">{formatDate(payment.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-medium">₮{payment.amount} MNT</div>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(payment.status)}
                        {getPaymentMethodBadge(payment.paymentMethod)}
                      </div>
                      {payment.bankTransferReference && (
                        <div className="text-xs text-gray-500 mt-1">
                          Ref: {payment.bankTransferReference}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {payment.paymentMethod === "bank_transfer" && payment.status === "pending" && (
                        <Button
                          onClick={() => confirmBankTransfer(payment._id, payment.bankTransferReference)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Баталгаажуулах
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
