"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Settings, Save, Globe, Shield, CreditCard, Mail, Database, Palette } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PlatformSettings {
  siteName: string
  siteDescription: string
  siteUrl: string
  contactEmail: string
  supportEmail: string
  defaultCurrency: string
  timezone: string
  maintenanceMode: boolean
  allowRegistration: boolean
  requireEmailVerification: boolean
  maxFileSize: number
  freePreviewMinutes: number
  allowedFileTypes: string[]
  googleAnalyticsId: string
  facebookPixelId: string
  stripePublicKey: string
  stripeSecretKey: string
  qpayMerchantId: string
  qpayApiKey: string
  bunnyApiKey: string
  bunnyVideoLibraryId: string
  // Content Management
  stats: {
    totalStudents: string
    averageRating: string
    completedLessons: string
  }
  features: {
    feature1: {
      title: string
      description: string
      icon: string
    }
    feature2: {
      title: string
      description: string
      icon: string
    }
    feature3: {
      title: string
      description: string
      icon: string
    }
  }
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<PlatformSettings>({
    siteName: "New Era Platform",
    siteDescription: "Online Learning Platform",
    siteUrl: "http://localhost:3000",
    contactEmail: "contact@newera.com",
    supportEmail: "support@newera.com",
    defaultCurrency: "MNT",
    timezone: "Asia/Ulaanbaatar",
    maintenanceMode: false,
    allowRegistration: true,
    requireEmailVerification: false,
    maxFileSize: 0, // 0 means no file size limit
    freePreviewMinutes: 0,
    allowedFileTypes: ["mp4", "avi", "mov", "wmv", "flv", "webm"],
    googleAnalyticsId: "",
    facebookPixelId: "",
    stripePublicKey: "",
    stripeSecretKey: "",
    qpayMerchantId: "",
    qpayApiKey: "",
    bunnyApiKey: "",
    bunnyVideoLibraryId: "",
    // Content Management
    stats: {
      totalStudents: "0",
      averageRating: "0.0",
      completedLessons: "0"
    },
    features: {
      feature1: {
        title: "Онлайн сургалт",
        description: "Хугацаатай, хурдан, хүнсэн сургалт",
        icon: "📚"
      },
      feature2: {
        title: "Харилцах",
        description: "Харилцах, харилцах, харилцах",
        icon: "💬"
      },
      feature3: {
        title: "Хувь хүн",
        description: "Хувь хүн, хувь хүн, хувь хүн",
        icon: "👥"
      }
    }
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    checkAuth()
  }, [])

  // Ensure settings are properly initialized
  useEffect(() => {
    if (!loading && settings) {
      // Ensure allowedFileTypes is always an array
      if (!Array.isArray(settings.allowedFileTypes)) {
        setSettings(prev => ({
          ...prev,
          allowedFileTypes: ["mp4", "avi", "mov", "wmv", "flv", "webm"]
        }))
      }
    }
  }, [loading, settings])

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
      
      fetchSettings()
    } catch (error) {

      router.push("/admin/login")
    }
  }

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings")
      if (response.ok) {
        const data = await response.json()
        // Merge API response with default settings to ensure all fields exist
        const mergedSettings = {
          ...settings, // Start with current default settings
          ...data.settings, // Override with API response
          allowedFileTypes: data.settings?.allowedFileTypes || ["mp4", "avi", "mov", "wmv", "flv", "webm"],
          stats: {
            ...settings.stats,
            ...data.settings?.stats
          },
          features: {
            ...settings.features,
            ...data.settings?.features
          }
        }
        setSettings(mergedSettings)
      } else {
        // Use default settings if API fails
        console.log("API failed, using default settings")
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
      // Use default settings if API fails
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Settings saved successfully"
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to save settings",
          variant: "destructive"
        })
      }
    } catch (error) {

      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (key: keyof PlatformSettings, value: any) => {
    setSettings(prev => {
      // Special handling for allowedFileTypes to ensure it's always an array
      if (key === "allowedFileTypes") {
        const fileTypes = Array.isArray(value) ? value : value.split(", ").map((t: string) => t.trim()).filter((t: string) => t)
        return { ...prev, [key]: fileTypes }
      }
      return { ...prev, [key]: value }
    })
  }

  if (loading || !settings.allowedFileTypes) {
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
        <h1 className="text-3xl font-bold text-gray-900">Тохиргоо</h1>
        <p className="text-gray-600">Платформын тохиргоо ба тохируулга</p>
      </div>

      {/* Settings Form */}
      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
        <div className="space-y-6">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Ерөнхий тохиргоо
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="siteName">Сайтын нэр</Label>
                  <Input
                    id="siteName"
                    value={settings.siteName}
                    onChange={(e) => handleInputChange("siteName", e.target.value)}
                    placeholder="Enter site name"
                  />
                </div>
                <div>
                  <Label htmlFor="siteUrl">Сайтын URL</Label>
                  <Input
                    id="siteUrl"
                    value={settings.siteUrl}
                    onChange={(e) => handleInputChange("siteUrl", e.target.value)}
                    placeholder="Enter site URL"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="siteDescription">Сайтын тайлбар</Label>
                <Textarea
                  id="siteDescription"
                  value={settings.siteDescription}
                  onChange={(e) => handleInputChange("siteDescription", e.target.value)}
                  placeholder="Enter site description"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactEmail">Холбоо барих имэйл</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) => handleInputChange("contactEmail", e.target.value)}
                    placeholder="Enter contact email"
                  />
                </div>
                <div>
                  <Label htmlFor="supportEmail">Дэмжлэгийн имэйл</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) => handleInputChange("supportEmail", e.target.value)}
                    placeholder="Enter support email"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="defaultCurrency">Үндсэн валют</Label>
                  <Select value={settings.defaultCurrency} onValueChange={(value) => handleInputChange("defaultCurrency", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MNT">MNT (₮)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="timezone">Цагийн бүс</Label>
                  <Select value={settings.timezone} onValueChange={(value) => handleInputChange("timezone", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Ulaanbaatar">Asia/Ulaanbaatar (UTC+8)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">America/New_York (UTC-5)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Platform Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Платформын тохиргоо
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="maintenanceMode">Засварын горим</Label>
                  <p className="text-sm text-gray-500">Сайтыг засварын горимд оруулах</p>
                </div>
                <Switch
                  id="maintenanceMode"
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => handleInputChange("maintenanceMode", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="allowRegistration">Бүртгэл зөвшөөрөх</Label>
                  <p className="text-sm text-gray-500">Шинэ хэрэглэгчдийн бүртгэлийг зөвшөөрөх</p>
                </div>
                <Switch
                  id="allowRegistration"
                  checked={settings.allowRegistration}
                  onCheckedChange={(checked) => handleInputChange("allowRegistration", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="requireEmailVerification">Имэйл баталгаажуулалт шаардах</Label>
                  <p className="text-sm text-gray-500">Хэрэглэгчдийн имэйл баталгаажуулалт шаардах</p>
                </div>
                <Switch
                  id="requireEmailVerification"
                  checked={settings.requireEmailVerification}
                  onCheckedChange={(checked) => handleInputChange("requireEmailVerification", checked)}
                />
              </div>
              <div>
                <Label htmlFor="freePreviewMinutes">Төлбөргүй үзүүлэх минут</Label>
                <Input
                  id="freePreviewMinutes"
                  type="number"
                  min="0"
                  value={settings.freePreviewMinutes}
                  onChange={(e) => handleInputChange("freePreviewMinutes", Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Бүртгэлтэй боловч төлбөр төлөөгүй хэрэглэгч хэдэн минут үнэгүй үзэхийг тохируулна. 0 бол үнэгүй үзүүлэхгүй.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* File Upload Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Файл байршуулах тохиргоо
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxFileSize">Хамгийн их файлын хэмжээ (MB) - 0 = хязгааргүй</Label>
                  <Input
                    id="maxFileSize"
                    type="number"
                    value={settings.maxFileSize}
                    onChange={(e) => handleInputChange("maxFileSize", parseInt(e.target.value))}
                    placeholder="0 = no limit"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Set to 0 to remove file size restrictions for video uploads
                  </p>
                </div>
                <div>
                  <Label htmlFor="allowedFileTypes">Зөвшөөрөгдсөн файлын төрлүүд</Label>
                  <Input
                    id="allowedFileTypes"
                    value={(settings.allowedFileTypes || ["mp4", "avi", "mov", "wmv"]).join(", ")}
                    onChange={(e) => handleInputChange("allowedFileTypes", e.target.value ? e.target.value.split(", ").map((t: string) => t.trim()) : [])}
                    placeholder="mp4, avi, mov, wmv"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Төлбөрийн тохиргоо
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="qpayMerchantId">QPay Merchant ID</Label>
                  <Input
                    id="qpayMerchantId"
                    value={settings.qpayMerchantId}
                    onChange={(e) => handleInputChange("qpayMerchantId", e.target.value)}
                    placeholder="Enter QPay Merchant ID"
                  />
                </div>
                <div>
                  <Label htmlFor="qpayApiKey">QPay API Key</Label>
                  <Input
                    id="qpayApiKey"
                    type="password"
                    value={settings.qpayApiKey}
                    onChange={(e) => handleInputChange("qpayApiKey", e.target.value)}
                    placeholder="Enter QPay API Key"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bunny.net Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Bunny.net тохиргоо
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bunnyApiKey">Bunny.net API Key</Label>
                  <Input
                    id="bunnyApiKey"
                    type="password"
                    value={settings.bunnyApiKey}
                    onChange={(e) => handleInputChange("bunnyApiKey", e.target.value)}
                    placeholder="Enter Bunny.net API Key"
                  />
                </div>
                <div>
                  <Label htmlFor="bunnyVideoLibraryId">Video Library ID</Label>
                  <Input
                    id="bunnyVideoLibraryId"
                    value={settings.bunnyVideoLibraryId}
                    onChange={(e) => handleInputChange("bunnyVideoLibraryId", e.target.value)}
                    placeholder="Enter Video Library ID"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analytics Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Аналитик тохиргоо
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="googleAnalyticsId">Google Analytics ID</Label>
                  <Input
                    id="googleAnalyticsId"
                    value={settings.googleAnalyticsId}
                    onChange={(e) => handleInputChange("googleAnalyticsId", e.target.value)}
                    placeholder="Enter Google Analytics ID"
                  />
                </div>
                <div>
                  <Label htmlFor="facebookPixelId">Facebook Pixel ID</Label>
                  <Input
                    id="facebookPixelId"
                    value={settings.facebookPixelId}
                    onChange={(e) => handleInputChange("facebookPixelId", e.target.value)}
                    placeholder="Enter Facebook Pixel ID"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Мэдээллийн нэгдсэн хэсэг
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">Статистик болон онцлог шинж чанаруудыг засварлах</p>
                <div className="flex gap-4 justify-center">
                  <Button asChild variant="outline">
                    <a href="/admin/stats">Статистик засвар</a>
                  </Button>
                  <Button asChild variant="outline">
                    <a href="/admin/features">Онцлог шинж чанар</a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={saving} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {saving ? "Хадгалж байна..." : "Хадгалах"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
