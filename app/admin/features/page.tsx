"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Save, Sparkles, BookOpen, MessageCircle, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PlatformFeature {
  title: string
  description: string
  icon: string
}

interface PlatformFeatures {
  feature1: PlatformFeature
  feature2: PlatformFeature
  feature3: PlatformFeature
}

export default function AdminFeatures() {
  const [features, setFeatures] = useState<PlatformFeatures>({
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
      
      fetchFeatures()
    } catch (error) {
      router.push("/admin/login")
    }
  }

  const fetchFeatures = async () => {
    try {
      const response = await fetch("/api/admin/settings")
      if (response.ok) {
        const data = await response.json()
        if (data.settings.features) {
          setFeatures(data.settings.features)
        }
      }
    } catch (error) {
      console.error("Error fetching features:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFeatureChange = (featureKey: keyof PlatformFeatures, field: keyof PlatformFeature, value: string) => {
    setFeatures(prev => ({
      ...prev,
      [featureKey]: {
        ...prev[featureKey],
        [field]: value
      }
    }))
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
      
      // Merge features with existing settings, but remove _id field
      const { _id, ...settingsWithoutId } = currentSettings.settings
      const updatedSettings = {
        ...settingsWithoutId,
        features: features
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
          description: "Features updated successfully"
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to update features",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Save error:", error)
      toast({
        title: "Error",
        description: "Failed to update features",
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
        <h1 className="text-3xl font-bold text-gray-900">Онцлог шинж чанар засвар</h1>
        <p className="text-gray-600">Платформын онцлог шинж чанаруудыг засварлах</p>
      </div>

      {/* Features Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feature 1 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              Онлайн сургалт
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="feature1Title">Гарчиг</Label>
              <Input
                id="feature1Title"
                value={features.feature1.title}
                onChange={(e) => handleFeatureChange("feature1", "title", e.target.value)}
                placeholder="Онлайн сургалт"
              />
            </div>
            <div>
              <Label htmlFor="feature1Icon">Икон (emoji)</Label>
              <Input
                id="feature1Icon"
                value={features.feature1.icon}
                onChange={(e) => handleFeatureChange("feature1", "icon", e.target.value)}
                placeholder="📚"
              />
            </div>
            <div>
              <Label htmlFor="feature1Description">Тайлбар</Label>
              <Textarea
                id="feature1Description"
                value={features.feature1.description}
                onChange={(e) => handleFeatureChange("feature1", "description", e.target.value)}
                placeholder="Хугацаатай, хурдан, хүнсэн сургалт"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Feature 2 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-600" />
              Харилцах
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="feature2Title">Гарчиг</Label>
              <Input
                id="feature2Title"
                value={features.feature2.title}
                onChange={(e) => handleFeatureChange("feature2", "title", e.target.value)}
                placeholder="Харилцах"
              />
            </div>
            <div>
              <Label htmlFor="feature2Icon">Икон (emoji)</Label>
              <Input
                id="feature2Icon"
                value={features.feature2.icon}
                onChange={(e) => handleFeatureChange("feature2", "icon", e.target.value)}
                placeholder="💬"
              />
            </div>
            <div>
              <Label htmlFor="feature2Description">Тайлбар</Label>
              <Textarea
                id="feature2Description"
                value={features.feature2.description}
                onChange={(e) => handleFeatureChange("feature2", "description", e.target.value)}
                placeholder="Харилцах, харилцах, харилцах"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Feature 3 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Хувь хүн
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="feature3Title">Гарчиг</Label>
              <Input
                id="feature3Title"
                value={features.feature3.title}
                onChange={(e) => handleFeatureChange("feature3", "title", e.target.value)}
                placeholder="Хувь хүн"
              />
            </div>
            <div>
              <Label htmlFor="feature3Icon">Икон (emoji)</Label>
              <Input
                id="feature3Icon"
                value={features.feature3.icon}
                onChange={(e) => handleFeatureChange("feature3", "icon", e.target.value)}
                placeholder="👥"
              />
            </div>
            <div>
              <Label htmlFor="feature3Description">Тайлбар</Label>
              <Textarea
                id="feature3Description"
                value={features.feature3.description}
                onChange={(e) => handleFeatureChange("feature3", "description", e.target.value)}
                placeholder="Хувь хүн, хувь хүн, хувь хүн"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Хадгалж байна..." : "Хадгалах"}
        </Button>
      </div>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Урьдчилан харах
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="text-center p-8 border border-gray-100 shadow-lg rounded-2xl bg-white">
              <CardContent className="space-y-6 p-0">
                <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto">
                  <span className="text-3xl">{features.feature1.icon}</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{features.feature1.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{features.feature1.description}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="text-center p-8 border border-gray-100 shadow-lg rounded-2xl bg-white">
              <CardContent className="space-y-6 p-0">
                <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto">
                  <span className="text-3xl">{features.feature2.icon}</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{features.feature2.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{features.feature2.description}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="text-center p-8 border border-gray-100 shadow-lg rounded-2xl bg-white">
              <CardContent className="space-y-6 p-0">
                <div className="w-20 h-20 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto">
                  <span className="text-3xl">{features.feature3.icon}</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{features.feature3.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{features.feature3.description}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
