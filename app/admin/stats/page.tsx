"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Save, TrendingUp, Users, Star, Trophy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PlatformStats {
  totalStudents: string
  averageRating: string
  completedLessons: string
}

export default function AdminStats() {
  const [stats, setStats] = useState<PlatformStats>({
    totalStudents: "100+",
    averageRating: "4.8/5",
    completedLessons: "15,000+"
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
      
      fetchStats()
    } catch (error) {
      router.push("/admin/login")
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/settings")
      if (response.ok) {
        const data = await response.json()
        if (data.settings.stats) {
          setStats(data.settings.stats)
        }
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (key: keyof PlatformStats, value: string) => {
    setStats(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // First fetch current settings
      const currentSettingsResponse = await fetch("/api/admin/settings")
      if (!currentSettingsResponse.ok) {
        throw new Error("Failed to fetch current settings")
      }
      
      const currentSettings = await currentSettingsResponse.json()
      
      // Merge stats with existing settings, but remove _id field
      const { _id, ...settingsWithoutId } = currentSettings.settings
      const updatedSettings = {
        ...settingsWithoutId,
        stats: stats
      }
      
      // Save updated settings
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedSettings)
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Statistics updated successfully"
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to update statistics",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Save error:", error)
      toast({
        title: "Error",
        description: "Failed to update statistics",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

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
        <h1 className="text-3xl font-bold text-gray-900">Статистик засвар</h1>
        <p className="text-gray-600">Платформын статистик мэдээллийг засварлах</p>
      </div>

      {/* Stats Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Статистик мэдээлэл
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Students */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <Label htmlFor="totalStudents" className="text-lg font-semibold">Нийт сурагч</Label>
              </div>
              <Input
                id="totalStudents"
                value={stats.totalStudents}
                onChange={(e) => handleInputChange("totalStudents", e.target.value)}
                placeholder="100+"
                className="text-lg"
              />
              <p className="text-sm text-gray-500">Идэвхтэй суралцаж буй суралцагчид</p>
            </div>

            {/* Average Rating */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <Label htmlFor="averageRating" className="text-lg font-semibold">Дундаж үнэлгээ</Label>
              </div>
              <Input
                id="averageRating"
                value={stats.averageRating}
                onChange={(e) => handleInputChange("averageRating", e.target.value)}
                placeholder="4.8/5"
                className="text-lg"
              />
              <p className="text-sm text-gray-500">Суралцагчдын сэтгэгдэл</p>
            </div>

            {/* Completed Lessons */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-green-600" />
                <Label htmlFor="completedLessons" className="text-lg font-semibold">Хичээл дуусгасан</Label>
              </div>
              <Input
                id="completedLessons"
                value={stats.completedLessons}
                onChange={(e) => handleInputChange("completedLessons", e.target.value)}
                placeholder="15,000+"
                className="text-lg"
              />
              <p className="text-sm text-gray-500">Амжилттай төгссөн хичээллүүд</p>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Хадгалж байна..." : "Хадгалах"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Урьдчилан харах</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">{stats.totalStudents}</div>
              <div className="text-gray-600 font-medium">Нийт сурагч</div>
            </div>

            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-yellow-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">{stats.averageRating}</div>
              <div className="text-gray-600 font-medium">Дундаж үнэлгээ</div>
            </div>

            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">{stats.completedLessons}</div>
              <div className="text-gray-600 font-medium">Хичээл дуусгасан</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
