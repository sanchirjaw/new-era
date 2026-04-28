"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/lib/hooks/useAuth"
import { 
  Shield, 
  Bell, 
  Eye, 
  Key, 
  Mail, 
  Moon, 
  Sun, 
  Globe, 
  Trash2,
  AlertTriangle 
} from "lucide-react"
import Link from "next/link"

export default function SettingsPage() {
  const { user, loading } = useAuth()
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: false,
      course: true,
      marketing: false
    },
    privacy: {
      profileVisible: true,
      showProgress: true,
      showCertificates: true
    },
    preferences: {
      theme: "light",
      language: "mn"
    }
  })

  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: ""
  })

  const handleNotificationChange = (key: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value
      }
    }))
  }

  const handlePrivacyChange = (key: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: value
      }
    }))
  }

  const handlePasswordChange = () => {
    if (passwords.new !== passwords.confirm) {
      alert("Шинэ нууц үг таарахгүй байна")
      return
    }
    
    // Here you would typically call an API to change the password
    
    alert("Нууц үг амжилттай солигдлоо")
    setPasswords({ current: "", new: "", confirm: "" })
  }

  const handleDeleteAccount = () => {
    if (confirm("Та өөрийн аккаунтыг устгахдаа итгэлтэй байна уу? Энэ үйлдэл буцаах боломжгүй.")) {
      // Here you would typically call an API to delete the account

      alert("Аккаунт устгах хүсэлт илгээгдлээ")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-gray-200 h-32 rounded"></div>
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Нэвтрэх шаардлагатай</h1>
          <p className="text-gray-600 mb-6">Энэ хуудсыг үзэхийн тулд нэвтэрнэ үү.</p>
          <Link href="/login">
            <Button>Нэвтрэх</Button>
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Тохиргоо</h1>
            <p className="text-gray-600">Аккаунт болон аппликешний тохиргоог өөрчлөх</p>
          </div>

          <div className="space-y-6">
            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Мэдэгдэл
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-notifications">Имэйл мэдэгдэл</Label>
                    <p className="text-sm text-gray-600">Шинэ хичээл болон мэдээллийн имэйл хүлээн авах</p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={settings.notifications.email}
                    onCheckedChange={(value) => handleNotificationChange("email", value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="push-notifications">Push мэдэгдэл</Label>
                    <p className="text-sm text-gray-600">Браузер дээрх мэдэгдэл хүлээн авах</p>
                  </div>
                  <Switch
                    id="push-notifications"
                    checked={settings.notifications.push}
                    onCheckedChange={(value) => handleNotificationChange("push", value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="course-notifications">Хичээлийн мэдэгдэл</Label>
                    <p className="text-sm text-gray-600">Хичээлийн шинэчлэлт болон сануулга</p>
                  </div>
                  <Switch
                    id="course-notifications"
                    checked={settings.notifications.course}
                    onCheckedChange={(value) => handleNotificationChange("course", value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="marketing-notifications">Маркетингийн мэдэгдэл</Label>
                    <p className="text-sm text-gray-600">Урамшуулал болон шинэ бүтээгдэхүүний мэдээ</p>
                  </div>
                  <Switch
                    id="marketing-notifications"
                    checked={settings.notifications.marketing}
                    onCheckedChange={(value) => handleNotificationChange("marketing", value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Privacy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Нууцлал
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="profile-visible">Профайл харагдах эрх</Label>
                    <p className="text-sm text-gray-600">Бусад хэрэглэгчид таны профайлыг харах боломж</p>
                  </div>
                  <Switch
                    id="profile-visible"
                    checked={settings.privacy.profileVisible}
                    onCheckedChange={(value) => handlePrivacyChange("profileVisible", value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="show-progress">Явцыг харуулах</Label>
                    <p className="text-sm text-gray-600">Суралцах явцыг бусадад харуулах</p>
                  </div>
                  <Switch
                    id="show-progress"
                    checked={settings.privacy.showProgress}
                    onCheckedChange={(value) => handlePrivacyChange("showProgress", value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="show-certificates">Гэрчилгээ харуулах</Label>
                    <p className="text-sm text-gray-600">Олж авсан гэрчилгээнүүдээ бусадад харуулах</p>
                  </div>
                  <Switch
                    id="show-certificates"
                    checked={settings.privacy.showCertificates}
                    onCheckedChange={(value) => handlePrivacyChange("showCertificates", value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Тохируулга
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Загвар</Label>
                    <select
                      id="theme"
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={settings.preferences.theme}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        preferences: { ...prev.preferences, theme: e.target.value }
                      }))}
                    >
                      <option value="light">Цагаан</option>
                      <option value="dark">Хар</option>
                      <option value="auto">Автомат</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language">Хэл</Label>
                    <select
                      id="language"
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={settings.preferences.language}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        preferences: { ...prev.preferences, language: e.target.value }
                      }))}
                    >
                      <option value="mn">Монгол</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Аюулгүй байдал
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Одоогийн нууц үг</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={passwords.current}
                      onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                      placeholder="Одоогийн нууц үгээ оруулна уу"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-password">Шинэ нууц үг</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={passwords.new}
                        onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                        placeholder="Шинэ нууц үг"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Нууц үг баталгаажуулах</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={passwords.confirm}
                        onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                        placeholder="Нууц үгээ дахин оруулна уу"
                      />
                    </div>
                  </div>

                  <Button onClick={handlePasswordChange} className="w-full md:w-auto">
                    <Shield className="w-4 h-4 mr-2" />
                    Нууц үг солих
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                  Аюултай бүс
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-red-800 mb-2">Аккаунт устгах</h3>
                  <p className="text-red-700 text-sm mb-4">
                    Аккаунтыг устгасны дараа бүх мэдээлэл алдагдана. Энэ үйлдэл буцаах боломжгүй.
                  </p>
                  <Button 
                    variant="destructive" 
                    onClick={handleDeleteAccount}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Аккаунт устгах
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
