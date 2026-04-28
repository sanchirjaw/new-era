"use client"

import { useState, useEffect, useCallback } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/lib/hooks/useAuth"
import { User, Mail, Phone, Edit, Save, X, Lock, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { toast } from "@/components/ui/use-toast"

export default function ProfilePage() {
  const { user, loading, refreshUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [userStats, setUserStats] = useState({
    totalCourses: 0,
    completedCourses: 0
  })
  const [statsLoading, setStatsLoading] = useState(true)
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    newPassword: "",
    confirmPassword: ""
  })
  
  // Original data for comparison and reset
  const [originalData, setOriginalData] = useState({
    name: "",
    email: "",
    phone: "",
  })

  // Safe access to userStats with fallbacks
  const safeUserStats = {
    totalCourses: userStats?.totalCourses || 0,
    completedCourses: userStats?.completedCourses || 0
  }

  // Safe stats display component
  const SafeStatsDisplay = () => {
    try {
      const safeStats = safeUserStats || { totalCourses: 0, completedCourses: 0 }
      
      return (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Нийт хичээл:</span>
            <span className="font-semibold">
              {statsLoading ? "..." : (safeStats.totalCourses ?? 0)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Дууссан хичээл:</span>
            <span className="font-semibold">
              {statsLoading ? "..." : (safeStats.completedCourses ?? 0)}
            </span>
          </div>
        </div>
      )
    } catch (error) {
      return (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Элссэн хичээлүүд=:</span>
            <span className="font-semibold">0</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Дууссан хичээл:</span>
            <span className="font-semibold">0</span>
          </div>
        </div>
      )
    }
  }

  const fetchUserStats = useCallback(async () => {
    try {
      setStatsLoading(true)
      if (!user?.id) {
        setUserStats({ totalCourses: 0, completedCourses: 0 })
        return
      }
      
      const response = await fetch(`/api/auth/my-stats`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const statsData = await response.json()
        
        if (statsData?.stats) {
          setUserStats({
            totalCourses: statsData.stats.enrolledCourses ?? 0,
            completedCourses: statsData.stats.completedLessons ?? 0
          })
        } else {
          setUserStats({
            totalCourses: 0,
            completedCourses: 0
          })
        }
      } else {
        setUserStats({
          totalCourses: 0,
          completedCourses: 0
        })
      }
    } catch (error) {
      setUserStats({
        totalCourses: 0,
        completedCourses: 0
      })
    } finally {
      setStatsLoading(false)
    }
  }, [user?.id])

  const fetchUserProfile = useCallback(async () => {
    try {
      if (!user?.id) return
      
      const response = await fetch(`/api/auth/profile`, {
        credentials: 'include'
      })
      if (response.ok) {
        const profileData = await response.json()
        
        if (profileData.user) {
          const { user: userDetails } = profileData
          
          const userFormData = {
            name: userDetails.name || "",
            email: userDetails.email || "",
            phone: userDetails.phone || "",
            newPassword: "",
            confirmPassword: ""
          }
          
          setFormData(userFormData)
          setOriginalData({
            name: userDetails.name || "",
            email: userDetails.email || "",
            phone: userDetails.phone || ""
          })
        }
      }
    } catch (error) {
      // Handle error silently
    }
  }, [user?.id])

  // Initialize form data when user is loaded
  useEffect(() => {
    if (user && user.id) {
      const timer = setTimeout(() => {
        fetchUserProfile()
        fetchUserStats()
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [user?.id, fetchUserProfile, fetchUserStats])

  // Initialize form data from user object when user changes
  useEffect(() => {
    if (user && !formData.name) {
      const initialFormData = {
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        newPassword: "",
        confirmPassword: ""
      }
      setFormData(initialFormData)
      setOriginalData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || ""
      })
    }
  }, [user, formData.name])

  // Check if form has changes
  const hasChanges = () => {
    try {
      if (!originalData?.name || !originalData?.email) {
        return false
      }
      
      return (
        formData.name !== originalData.name ||
        formData.email !== originalData.email ||
        formData.phone !== originalData.phone ||
        formData.newPassword !== "" ||
        formData.confirmPassword !== ""
      )
    } catch (error) {
      return false
    }
  }

  // Validate form data
  const validateForm = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Name is required",
        variant: "destructive"
      })
      return false
    }

    if (!formData.email.trim()) {
      toast({
        title: "Validation Error",
        description: "Email is required",
        variant: "destructive"
      })
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address",
        variant: "destructive"
      })
      return false
    }

    if (formData.phone && formData.phone.trim()) {
      const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/
      if (!phoneRegex.test(formData.phone.trim())) {
        toast({
          title: "Validation Error",
          description: "Please enter a valid phone number",
          variant: "destructive"
        })
        return false
      }
    }

    return true
  }

  // Start editing
  const startEditing = () => {
    try {
      if (!originalData?.name || !originalData?.email) {
        return
      }
      
      if (!userStats || typeof userStats.totalCourses === 'undefined') {
        return
      }
      
      setIsEditing(true)
      setShowPassword(false)
      setFormData(prev => ({
        ...prev,
        newPassword: "",
        confirmPassword: ""
      }))
    } catch (error) {
      // Handle error silently
    }
  }

  // Cancel editing
  const cancelEditing = () => {
    if (hasChanges()) {
      if (confirm("You have unsaved changes. Are you sure you want to cancel?")) {
        setIsEditing(false)
        setShowPassword(false)
        setFormData(prev => ({
          ...prev,
          name: originalData.name,
          email: originalData.email,
          phone: originalData.phone,
          newPassword: "",
          confirmPassword: ""
        }))
      }
    } else {
      setIsEditing(false)
      setShowPassword(false)
      setFormData(prev => ({
        ...prev,
        name: originalData.name,
        email: originalData.email,
        phone: originalData.phone,
        newPassword: "",
        confirmPassword: ""
      }))
    }
  }

  // Save changes
  const saveChanges = async () => {
    if (!hasChanges()) {
      setIsEditing(false)
      return
    }

    if (!validateForm()) {
      return
    }

    if (formData.newPassword || formData.confirmPassword) {
      if (!formData.newPassword || !formData.confirmPassword) {
        toast({
          title: "Validation Error",
          description: "Both password fields are required",
          variant: "destructive"
        })
        return
      }
      if (formData.newPassword !== formData.confirmPassword) {
        toast({
          title: "Validation Error",
          description: "Passwords do not match",
          variant: "destructive"
        })
        return
      }
      if (formData.newPassword.length < 6) {
        toast({
          title: "Validation Error",
          description: "Password must be at least 6 characters long",
          variant: "destructive"
        })
        return
      }
    }

    setIsSaving(true)
    
    try {
      const requestBody = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword
      }
      
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        let updateMessage = "Profile updated successfully."
        const updates = []
        
        if (formData.name !== originalData.name) updates.push("name")
        if (formData.email !== originalData.email) updates.push("email")
        if (formData.phone !== originalData.phone) updates.push("phone")
        if (formData.newPassword) updates.push("password")
        
        if (updates.length > 0) {
          updateMessage = `Updated: ${updates.join(", ")}`
        }
        
        toast({
          title: "Success!",
          description: updateMessage,
        })
        
        await refreshUser()
        await fetchUserProfile()
        await fetchUserStats()
        
        setFormData(prev => ({
          ...prev,
          newPassword: "",
          confirmPassword: ""
        }))
        
        setIsEditing(false)
      } else {
        if (response.status >= 500) {
          toast({
            title: "Server Error",
            description: "Failed to update profile. Please try again later.",
            variant: "destructive"
          })
        }
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Please check your internet connection and try again.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Handle input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
            <div className="bg-muted h-64 rounded"></div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Нэвтрэх шаардлагатай</h1>
          <p className="text-muted-foreground mb-6">Энэ хуудсыг үзэхийн тулд нэвтэрнэ үү.</p>
          <Link href="/login">
            <Button>Нэвтрэх</Button>
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  if (!user.id) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Хэрэглэгчийн мэдээлэл дутуу</h1>
          <p className="text-muted-foreground mb-6">Хэрэглэгчийн мэдээлэл олдсонгүй. Дахин нэвтэрнэ үү.</p>
          <Link href="/login">
            <Button>Дахин нэвтрэх</Button>
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Миний профайл</h1>
            <p className="text-muted-foreground">Профайлын мэдээллээ засварлах</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Profile Info Card */}
            <div className="md:col-span-1">
              <Card>
                <CardContent className="p-6 text-center">
                  <Avatar className="h-24 w-24 mx-auto mb-4">
                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                      {formData.name?.charAt(0).toUpperCase() || user.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="text-xl font-semibold mb-2">
                    {formData.name || user.name || "User"}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {formData.email || user.email}
                  </p>
                  {(formData.phone || user.phone) && (
                    <p className="text-muted-foreground mb-4">
                      📱 {formData.phone || user.phone}
                    </p>
                  )}
                  
                  {/* Stats */}
                  <SafeStatsDisplay />
                </CardContent>
              </Card>
            </div>

            {/* Edit Form Card */}
            <div className="md:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Профайлын мэдээл</CardTitle>
                  {!isEditing ? (
                    <Button 
                      onClick={startEditing} 
                      variant="outline" 
                      size="sm"
                      disabled={statsLoading || !originalData.name || !originalData.email || !userStats || typeof userStats.totalCourses === 'undefined'}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      {statsLoading ? "Уншиж байна..." : "Засварлах"}
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button 
                        onClick={cancelEditing} 
                        variant="outline" 
                        size="sm"
                        disabled={isSaving}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Цуцлах
                      </Button>
                      <Button 
                        onClick={saveChanges} 
                        size="sm"
                        disabled={!hasChanges() || isSaving}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? "Хадгалж байна..." : "Хадгалах"}
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Name Field */}
                    <div>
                      <Label htmlFor="name">Нэр</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        disabled={!isEditing || isSaving}
                        className="mt-1"
                      />
                    </div>

                    {/* Email Field */}
                    <div>
                      <Label htmlFor="email">И-мэйл</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        disabled={!isEditing || isSaving}
                        className="mt-1"
                      />
                    </div>

                    {/* Phone Field */}
                    <div>
                      <Label htmlFor="phone">Утасны дугаар</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        disabled={!isEditing || isSaving}
                        className="mt-1"
                        placeholder="+976 99999999"
                      />
                    </div>

                    {/* Password Fields - Only show when editing */}
                    {isEditing && (
                      <>
                        <div className="border-t pt-4">
                          <h4 className="font-medium mb-3 flex items-center">
                            <Lock className="w-4 h-4 mr-2" />
                            Нууц үг солих
                          </h4>
                          
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="newPassword">Шинэ нууц үг</Label>
                              <div className="relative mt-1">
                                <Input
                                  id="newPassword"
                                  type={showPassword ? "text" : "password"}
                                  value={formData.newPassword}
                                  onChange={(e) => handleInputChange("newPassword", e.target.value)}
                                  placeholder="Хоосон үлдээх бол үлдээнэ үү"
                                  disabled={isSaving}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3"
                                  onClick={() => setShowPassword(!showPassword)}
                                  disabled={isSaving}
                                >
                                  {showPassword ? (
                                    <EyeOff className="w-4 h-4" />
                                  ) : (
                                    <Eye className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                            
                            <div>
                              <Label htmlFor="confirmPassword">Нууц үг давтах</Label>
                              <Input
                                id="confirmPassword"
                                type={showPassword ? "text" : "password"}
                                value={formData.confirmPassword}
                                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                                placeholder="Хоосон үлдээх бол үлдээнэ үү"
                                disabled={isSaving}
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}
