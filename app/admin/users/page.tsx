"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Users, Search, Plus, Edit, Trash2, Eye, BookOpen, GraduationCap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface User {
  _id: string
  name: string
  email: string
  role: "student" | "admin"
  profilePicture?: string
  enrolledCourses: string[]
  enrollmentExpiries?: Record<string, string | null>
  createdAt: string
  googleId?: string
}

interface Course {
  _id: string
  title: string
  description: string
  price: number
  isActive: boolean
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCourseAccessDialogOpen, setIsCourseAccessDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "student" as "student" | "admin"
  })
  const [courseAccessData, setCourseAccessData] = useState<{
    userId: string
    courseIds: string[]
    durationMonths: number | null
  }>({
    userId: "",
    courseIds: [],
    durationMonths: null
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
      
      fetchUsers()
      fetchCourses()
    } catch (error) {

      router.push("/admin/login")
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users", {
        cache: "no-store",
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch users",
          variant: "destructive"
        })
      }
    } catch (error) {

      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchCourses = async () => {
    try {
      const response = await fetch("/api/courses")
      if (response.ok) {
        const data = await response.json()
        setCourses(data.courses || [])
      }
    } catch (error) {

    }
  }

  const handleCreateUser = async () => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "User created successfully"
        })
        setIsCreateDialogOpen(false)
        setFormData({ name: "", email: "", password: "", role: "student" })
        fetchUsers()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to create user",
          variant: "destructive"
        })
      }
    } catch (error) {

      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive"
      })
    }
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) return

    try {
      const response = await fetch(`/api/admin/users/${selectedUser._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "User updated successfully"
        })
        setIsEditDialogOpen(false)
        setSelectedUser(null)
        setFormData({ name: "", email: "", password: "", role: "student" })
        fetchUsers()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to update user",
          variant: "destructive"
        })
      }
    } catch (error) {

      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive"
      })
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        cache: "no-store",
        credentials: "include",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "User deleted successfully"
        })
        fetchUsers()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to delete user",
          variant: "destructive"
        })
      }
    } catch (error) {

      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive"
      })
    }
  }

  const handleCourseAccess = async () => {
    try {
      const response = await fetch(`/api/admin/users/${courseAccessData.userId}/courses`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({
          courseIds: courseAccessData.courseIds,
          durationMonths: courseAccessData.durationMonths
        })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Course access updated successfully"
        })
        setIsCourseAccessDialogOpen(false)
        setCourseAccessData({ userId: "", courseIds: [], durationMonths: null })
        fetchUsers()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to update course access",
          variant: "destructive"
        })
      }
    } catch (error) {

      toast({
        title: "Error",
        description: "Failed to update course access",
        variant: "destructive"
      })
    }
  }

  const openCourseAccessDialog = (user: User) => {
    setCourseAccessData({
      userId: user._id,
      courseIds: user.enrolledCourses || [],
      durationMonths: null
    })
    setIsCourseAccessDialogOpen(true)
  }

  const getUserEnrolledCourses = (user: User) => {
    return courses.filter(course => user.enrolledCourses.includes(course._id))
  }

  const filteredUsers = users
    .filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      // Admin-ууд эхэнд
      if (a.role === "admin" && b.role !== "admin") return -1
      if (a.role !== "admin" && b.role === "admin") return 1
      // Access-тай хэрэглэгчид дараа нь
      const aHas = (a.enrolledCourses?.length || 0) > 0
      const bHas = (b.enrolledCourses?.length || 0) > 0
      if (aHas && !bHas) return -1
      if (!aHas && bHas) return 1
      return 0
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
        <h1 className="text-3xl font-bold text-gray-900">Хэрэглэгчид</h1>
        <p className="text-gray-600">Системийн бүх хэрэглэгчдийн жагсаалт</p>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Хэрэглэгчид</CardTitle>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  + Шинэ хэрэглэгч
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter user name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Enter user email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Enter user password"
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select value={formData.role} onValueChange={(value: "student" | "admin") => setFormData({ ...formData, role: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCreateUser} className="w-full">Create User</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search Bar */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Q Хэрэглэгч хайх..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Users List */}
          <div className="space-y-4">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No users found</div>
            ) : (
              filteredUsers.map((user) => {
                const hasAccess = (user.enrolledCourses?.length || 0) > 0
                return (
                <div key={user._id} className={`flex items-center justify-between p-4 border rounded-lg border-l-4 ${
                  user.role === "admin"
                    ? "border-l-red-500 bg-red-50/40"
                    : hasAccess
                    ? "border-l-green-500 bg-green-50/30"
                    : "border-l-gray-200"
                }`}>
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={user.profilePicture} />
                      <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{user.name}</h3>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={user.role === "admin" ? "destructive" : "secondary"}>
                          {user.role}
                        </Badge>
                        {user.googleId && (
                          <Badge variant="outline">Google</Badge>
                        )}
                        <Badge variant="outline" className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {user.enrolledCourses?.length || 0} courses
                        </Badge>
                      </div>
                      {/* Show enrolled courses with expiry */}
                      {user.enrolledCourses && user.enrolledCourses.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 mb-1">Элссэн хичээлүүд:</p>
                          <div className="flex flex-wrap gap-1">
                            {getUserEnrolledCourses(user).map(course => {
                              const expiry = user.enrollmentExpiries?.[course._id]
                              const isExpired = expiry && new Date(expiry) < new Date()
                              return (
                                <Badge key={course._id} variant={isExpired ? "destructive" : "secondary"} className="text-xs">
                                  {course.title}
                                  {expiry
                                    ? ` · ${isExpired ? "⛔" : "⏱"} ${new Date(expiry).toLocaleDateString("mn-MN")}`
                                    : " · ♾"}
                                </Badge>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openCourseAccessDialog(user)}
                      title="Manage course access"
                    >
                      <GraduationCap className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user)
                        setFormData({ name: user.name, email: user.email, password: "", role: user.role })
                        setIsEditDialogOpen(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteUser(user._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                )}
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter user name"
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter user email"
              />
            </div>
            <div>
              <Label htmlFor="edit-password">Password (leave blank to keep current)</Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter new password"
              />
            </div>
            <div>
              <Label htmlFor="edit-role">Role</Label>
              <Select value={formData.role} onValueChange={(value: "student" | "admin") => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleUpdateUser} className="w-full">Update User</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Course Access Dialog */}
      <Dialog open={isCourseAccessDialogOpen} onOpenChange={setIsCourseAccessDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Course Access</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            {/* Duration input */}
            <div>
              <Label className="text-sm font-semibold">⏱ Хандах хугацаа (сар, 0 = насан туршид)</Label>
              <input
                type="number"
                min={0}
                max={12}
                value={courseAccessData.durationMonths ?? 0}
                onChange={(e) => {
                  const v = parseInt(e.target.value) || 0
                  setCourseAccessData(prev => ({ ...prev, durationMonths: v === 0 ? null : v }))
                }}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0 = насан туршид"
              />
              <p className="text-xs mt-1" style={{ color: courseAccessData.durationMonths ? "#2563eb" : "#16a34a" }}>
                {!courseAccessData.durationMonths
                  ? "♾ Насан туршид нэвтрэх эрх"
                  : `⏱ Дуусах огноо: ${new Date(Date.now() + (courseAccessData.durationMonths ?? 0) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString("mn-MN")}`}
              </p>
            </div>

            {/* Course list */}
            <div>
              <Label className="text-sm font-semibold">📚 Хичээл сонгох</Label>
              <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                {courses.map((course) => (
                  <div key={course._id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`course-${course._id}`}
                      checked={courseAccessData.courseIds.includes(course._id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setCourseAccessData(prev => ({
                            ...prev,
                            courseIds: [...prev.courseIds, course._id]
                          }))
                        } else {
                          setCourseAccessData(prev => ({
                            ...prev,
                            courseIds: prev.courseIds.filter(id => id !== course._id)
                          }))
                        }
                      }}
                    />
                    <Label htmlFor={`course-${course._id}`} className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{course.title}</span>
                        <Badge variant={course.isActive ? "default" : "secondary"}>
                          {course.isActive ? "Идэвхтэй" : "Идэвхгүй"}
                        </Badge>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCourseAccessDialogOpen(false)}>
                Болих
              </Button>
              <Button
                onClick={handleCourseAccess}
                disabled={courseAccessData.durationMonths === undefined}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Хандах эрх олгох
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
