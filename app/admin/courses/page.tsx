"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { BookOpen, Plus, Search, Edit, Trash2, ChevronDown, ChevronRight, Video, Link, Upload, CheckCircle2, AlertCircle, FileVideo, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"


interface Lesson {
  _id: string
  title: string
  description: string
  videoUrl: string
  duration: number
  order: number
  isPreview: boolean
  subCourseId?: string
  bunnyVideoId?: string
  tusUploadId?: string
  thumbnailUrl?: string
}

interface SubCourse {
  _id: string
  courseId: string
  title: string
  description: string
  lessons: Lesson[]
  order: number
  isActive: boolean
}

interface Course {
  _id: string
  title: string
  description: string
  price: number
  originalPrice?: number
  accessDurationMonths?: number | null
  category: string
  level: "beginner" | "intermediate" | "advanced"
  duration: number
  videoUrl?: string
  thumbnailUrl?: string
  lessons: Lesson[]
  enrolledCount: number
  rating: number
  totalRatings: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function AdminCourses() {
  const { toast } = useToast()
  const router = useRouter()

  const [courses, setCourses] = useState<Course[]>([])
  const [subCourses, setSubCourses] = useState<SubCourse[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])

  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [selectedSubCourse, setSelectedSubCourse] = useState<SubCourse | null>(null)
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)

  const [isCreateCourseDialogOpen, setIsCreateCourseDialogOpen] = useState(false)
  const [isCreateSubCourseDialogOpen, setIsCreateSubCourseDialogOpen] = useState(false)
  const [isCreateLessonDialogOpen, setIsCreateLessonDialogOpen] = useState(false)
  const [isEditLessonDialogOpen, setIsEditLessonDialogOpen] = useState(false)
  const [editLessonFormData, setEditLessonFormData] = useState<{
    title: string
    description: string
    order: number
    isPreview: boolean
    thumbnailUrl: string
    thumbnailFile: File | null
  }>({
    title: "",
    description: "",
    order: 1,
    isPreview: false,
    thumbnailUrl: "",
    thumbnailFile: null
  })
  const [isEditCourseDialogOpen, setIsEditCourseDialogOpen] = useState(false)
  const [isEditSubCourseDialogOpen, setIsEditSubCourseDialogOpen] = useState(false)
  const [isConnectSubCourseDialogOpen, setIsConnectSubCourseDialogOpen] = useState(false)

  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set())
  const [expandedSubCourses, setExpandedSubCourses] = useState<Set<string>>(new Set())

  const [isCreatingLesson, setIsCreatingLesson] = useState(false)
  const [isUploadingInBackground, setIsUploadingInBackground] = useState(false)
  const [thumbnailUploadLoading, setThumbnailUploadLoading] = useState(false)

  type UploadStatus = 'idle' | 'initializing' | 'uploading' | 'creating' | 'done' | 'error'
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatusMsg, setUploadStatusMsg] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [lessonThumbnailPreview, setLessonThumbnailPreview] = useState<string | null>(null)
  const [editLessonThumbnailPreview, setEditLessonThumbnailPreview] = useState<string | null>(null)
  


  const [courseFormData, setCourseFormData] = useState({
    title: "",
    description: "",
    price: 0,
    originalPrice: 0,
    accessDurationMonths: null as number | null,
    category: "",
    level: "beginner" as "beginner" | "intermediate" | "advanced",
    isActive: true,
    thumbnailFile: null as File | null
  })

  const [subCourseFormData, setSubCourseFormData] = useState({
    title: "",
    description: "",
    order: 1,
    isActive: true
  })

  const [editCourseFormData, setEditCourseFormData] = useState({
    title: "",
    description: "",
    price: 0,
    originalPrice: 0,
    accessDurationMonths: null as number | null,
    category: "",
    level: "beginner" as "beginner" | "intermediate" | "advanced",
    isActive: true,
    thumbnailFile: null as File | null
  })

  const [editSubCourseFormData, setEditSubCourseFormData] = useState({
    title: "",
    description: "",
    order: 1,
    isActive: true
  })

  const [lessonFormData, setLessonFormData] = useState<{
    title: string
    description: string
    order: number
    isPreview: boolean
    videoFile: File | null
    thumbnailFile: File | null
  }>({
    title: "",
    description: "",
    order: 1,
    isPreview: false,
    videoFile: null,
    thumbnailFile: null
  })

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

      loadData()
    } catch (error) {
      console.error("Auth check failed:", error)
      router.push("/admin/login")
    }
  }

  const loadData = async () => {
    try {
      const [coursesRes, subCoursesRes] = await Promise.all([
        fetch("/api/admin/courses", { credentials: 'include' }),
        fetch("/api/admin/sub-courses", { credentials: 'include' })
      ])

      if (coursesRes.ok) {
        const data = await coursesRes.json()
        setCourses(data.courses || [])
      }
      if (subCoursesRes.ok) {
        const data = await subCoursesRes.json()
        setSubCourses(data.subCourses || [])
      }
    } catch (error) {
      console.error("Failed to load data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLessons = async (subCourseId: string): Promise<Lesson[]> => {
    try {
      const res = await fetch(`/api/admin/lessons?subCourseId=${subCourseId}`, {
        credentials: 'include'
      })
      if (!res.ok) return []
      const data = await res.json()
      return data.lessons || []
    } catch (e) {

      return []
    }
  }

  const toggleCourseExpansion = (courseId: string) => {
    const next = new Set(expandedCourses)
    if (next.has(courseId)) next.delete(courseId)
    else next.add(courseId)
    setExpandedCourses(next)
  }

  const toggleSubCourseExpansion = async (subCourseId: string) => {
    const next = new Set(expandedSubCourses)
    if (next.has(subCourseId)) {
      next.delete(subCourseId)
    } else {
      next.add(subCourseId)
      const lessonsData = await fetchLessons(subCourseId)
      setLessons(prevLessons => {
        const filtered = prevLessons.filter(l => l.subCourseId !== subCourseId)
        return [...filtered, ...lessonsData]
      })
    }
    setExpandedSubCourses(next)
  }

  const handleCreateCourse = async () => {
    try {
      setThumbnailUploadLoading(true)

      // Prepare course data
      const courseData = {
        title: courseFormData.title,
        description: courseFormData.description,
        price: courseFormData.price,
        originalPrice: courseFormData.originalPrice,
        accessDurationMonths: courseFormData.accessDurationMonths,
        category: courseFormData.category,
        level: courseFormData.level,
        isActive: courseFormData.isActive,
        thumbnailUrl: null as string | null
      }

      // Upload thumbnail if provided
      if (courseFormData.thumbnailFile) {
        toast({ title: "Uploading thumbnail...", description: "Please wait while we upload the thumbnail." })

        const formData = new FormData()
        formData.append('file', courseFormData.thumbnailFile)
        formData.append('name', `${courseFormData.title}_thumbnail`)
        formData.append('description', `Thumbnail for course: ${courseFormData.title}`)

        const uploadResponse = await fetch("/api/admin/media", {
          method: "POST",
          credentials: 'include',
          body: formData
        })

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json()
          courseData.thumbnailUrl = uploadResult.mediaItem.cloudinarySecureUrl || uploadResult.mediaItem.cloudinaryUrl
        } else {
          toast({ title: "Warning", description: "Thumbnail upload failed, continuing without thumbnail", variant: "destructive" })
        }
      }

      // Create course
      const res = await fetch("/api/admin/courses", {
        method: "POST",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(courseData)
      })

      if (res.ok) {
        toast({ title: "Success", description: "Course created successfully" })
        const data = await (await fetch("/api/admin/courses", { credentials: 'include' })).json()
        setCourses(data.courses || [])
        setIsCreateCourseDialogOpen(false)
        setCourseFormData({
          title: "",
          description: "",
          price: 0,
          originalPrice: 0,
          category: "",
          level: "beginner",
          isActive: true,
          thumbnailFile: null
        })
        setThumbnailPreview(null)
      } else {
        const err = await res.json()
        toast({ title: "Error", description: err.error || "Failed to create course", variant: "destructive" })
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to create course", variant: "destructive" })
    } finally {
      setThumbnailUploadLoading(false)
    }
  }

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm("Delete course?")) return
    try {
      const res = await fetch(`/api/admin/courses/${courseId}`, { 
        method: "DELETE",
        credentials: 'include'
      })
      if (res.ok) {
        setCourses(prev => prev.filter(c => c._id !== courseId))
        toast({ title: "Deleted", description: "Course deleted" })
      } else {
        const err = await res.json()
        toast({ title: "Error", description: err.error || "Failed", variant: "destructive" })
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to delete course", variant: "destructive" })
    }
  }

  const handleCreateSubCourse = async () => {
    if (!selectedCourse) return
    try {
      const res = await fetch("/api/admin/sub-courses", {
        method: "POST",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: subCourseFormData.title,
          description: subCourseFormData.description,
          courseId: selectedCourse._id,
          order: subCourseFormData.order,
          isActive: subCourseFormData.isActive
        })
      })
      if (res.ok) {
        toast({ title: "Success", description: "Sub-course created" })
        const data = await (await fetch("/api/admin/sub-courses", { credentials: 'include' })).json()
        setSubCourses(data.subCourses || [])
        setIsCreateSubCourseDialogOpen(false)
      } else {
        const err = await res.json()
        toast({ title: "Error", description: err.error || "Failed", variant: "destructive" })
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to create sub-course", variant: "destructive" })
    }
  }

  const handleDeleteSubCourse = async (subCourseId: string) => {
    if (!confirm("Delete sub-course?")) return
    try {
      const res = await fetch(`/api/admin/sub-courses/${subCourseId}`, { 
        method: "DELETE",
        credentials: 'include'
      })
      if (res.ok) {
        setSubCourses(prev => prev.filter(sc => sc._id !== subCourseId))
        setLessons(prev => prev.filter(l => l.subCourseId !== subCourseId))
        toast({ title: "Deleted", description: "Sub-course deleted" })
      } else {
        const err = await res.json()
        toast({ title: "Error", description: err.error || "Failed", variant: "destructive" })
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to delete sub-course", variant: "destructive" })
    }
  }

  const handleUpdateCourse = async () => {
    if (!selectedCourse) return
    try {
      const res = await fetch(`/api/admin/courses/${selectedCourse._id}`, {
        method: "PUT",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editCourseFormData)
      })
      if (res.ok) {
        toast({ title: "Updated", description: "Course updated" })
        setCourses(prev => prev.map(c => c._id === selectedCourse._id ? { ...c, ...editCourseFormData } as Course : c))
        setIsEditCourseDialogOpen(false)
      } else {
        const err = await res.json()
        toast({ title: "Error", description: err.error || "Failed", variant: "destructive" })
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to update course", variant: "destructive" })
    }
  }

  const handleUpdateSubCourse = async () => {
    if (!selectedSubCourse) return
    try {
      const res = await fetch(`/api/admin/sub-courses/${selectedSubCourse._id}`, {
        method: "PUT",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editSubCourseFormData)
      })
      if (res.ok) {
        toast({ title: "Updated", description: "Sub-course updated" })
        setSubCourses(prev => prev.map(sc => sc._id === selectedSubCourse._id ? { ...sc, ...editSubCourseFormData } as SubCourse : sc))
        setIsEditSubCourseDialogOpen(false)
      } else {
        const err = await res.json()
        toast({ title: "Error", description: err.error || "Failed", variant: "destructive" })
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to update sub-course", variant: "destructive" })
    }
  }

  const handleConnectSubCourse = async (subCourseId: string, courseId: string) => {
    try {
      const res = await fetch('/api/admin/sub-courses/connect', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subCourseId, courseId })
      })

      if (res.ok) {
        toast({ title: "Success", description: "Sub-course connected to course successfully" })
        // Refresh data to show the connection
        loadData()
      } else {
        const err = await res.json()
        toast({ title: "Error", description: err.error || "Failed to connect", variant: "destructive" })
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to connect sub-course", variant: "destructive" })
    }
  }

  const uploadFileWithProgress = (
    url: string,
    headers: Record<string, string>,
    file: File,
    onProgress: (pct: number) => void
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100))
        }
      })
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve()
        else reject(new Error(`Bunny.net upload failed: ${xhr.status} ${xhr.responseText.substring(0, 200)}`))
      })
      xhr.addEventListener('error', () => reject(new Error('Сүлжээний алдаа. Дахин оролдоно уу.')))
      xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')))
      xhr.open('PUT', url)
      Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v))
      xhr.send(file)
    })
  }

  const handleCreateLesson = async () => {
    if (!selectedSubCourse || !lessonFormData.videoFile) {
      toast({
        title: "Мэдээлэл дутуу байна",
        description: "Дэд хичээл сонгож, видео файл оруулна уу.",
        variant: "destructive",
      })
      return
    }
    if (isCreatingLesson) return

    setIsCreatingLesson(true)
    setUploadStatus('initializing')
    setUploadProgress(0)
    setUploadError('')
    setUploadStatusMsg('Bunny.net рүү холбогдож байна...')

    const videoFile = lessonFormData.videoFile
    const fileSize = videoFile.size
    const fileName = videoFile.name
    const contentType = videoFile.type
    const existingLessons = lessons.filter(l => l.subCourseId === selectedSubCourse._id)
    const nextOrder = existingLessons.length > 0 ? Math.max(...existingLessons.map(l => l.order)) + 1 : 1
    const formDataToSave = { ...lessonFormData, order: nextOrder }
    const subCourseIdToSave = selectedSubCourse._id

    setIsUploadingInBackground(true)

    try {
      // Step 1: Initialize upload on Bunny.net
      const tusInitResponse = await fetch('/api/admin/upload/tus', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Upload-Length': fileSize.toString(),
          'Upload-Metadata': `filename ${encodeURIComponent(fileName)},contentType ${encodeURIComponent(contentType)}`,
          'Tus-Resumable': '1.0.0'
        },
        body: JSON.stringify({ filename: fileName, fileSize, contentType })
      })

      if (!tusInitResponse.ok) {
        const errorData = await tusInitResponse.json()
        throw new Error(errorData.error || 'Холболт амжилтгүй боллоо')
      }

      const tusInitResult = await tusInitResponse.json()
      if (!tusInitResult.success || !tusInitResult.uploadUrl || !tusInitResult.videoId) {
        throw new Error('Upload URL авч чадсангүй')
      }

      // Step 2: Upload file with progress tracking
      setUploadStatus('uploading')
      setUploadProgress(0)
      setUploadStatusMsg(`Видео байршуулж байна...`)

      await uploadFileWithProgress(
        tusInitResult.uploadUrl,
        { ...tusInitResult.uploadHeaders, 'Content-Type': contentType },
        videoFile,
        (pct) => {
          setUploadProgress(pct)
          setUploadStatusMsg(`Видео байршуулж байна... ${pct}%`)
        }
      )

      // Step 3: Create lesson in DB
      setUploadStatus('creating')
      setUploadProgress(100)
      setUploadStatusMsg('Хичээл үүсгэж байна...')

      // Upload thumbnail if provided
      let thumbnailUrl = ''
      if (formDataToSave.thumbnailFile) {
        try {
          setUploadStatusMsg('Зураг байршуулж байна...')
          const thumbForm = new FormData()
          thumbForm.append('file', formDataToSave.thumbnailFile)
          thumbForm.append('name', `${formDataToSave.title || 'lesson'}_thumbnail`)
          thumbForm.append('description', `Thumbnail for lesson: ${formDataToSave.title}`)
          const thumbRes = await fetch('/api/admin/media', {
            method: 'POST',
            credentials: 'include',
            body: thumbForm
          })
          if (thumbRes.ok) {
            const thumbData = await thumbRes.json()
            thumbnailUrl = thumbData.mediaItem?.cloudinarySecureUrl || thumbData.mediaItem?.cloudinaryUrl || ''
          }
        } catch {}
        setUploadStatusMsg('Хичээл үүсгэж байна...')
      }

      const response = await fetch('/api/admin/lessons', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formDataToSave.title || 'Untitled Lesson',
          description: formDataToSave.description || '',
          subCourseId: subCourseIdToSave,
          order: formDataToSave.order || 1,
          isPreview: formDataToSave.isPreview || false,
          bunnyVideoId: tusInitResult.videoId,
          videoUrl: `https://iframe.mediadelivery.net/embed/651322/${tusInitResult.videoId}`,
          ...(thumbnailUrl && { thumbnailUrl })
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Хичээл үүсгэж чадсангүй')
      }

      // Step 4: Done
      setUploadStatus('done')
      setUploadStatusMsg('Амжилттай нэмэгдлээ!')

      if (subCourseIdToSave) {
        const lessonsData = await fetchLessons(subCourseIdToSave)
        setLessons(prev => {
          const filtered = prev.filter(l => l.subCourseId !== subCourseIdToSave)
          return [...filtered, ...lessonsData]
        })
      }

      setTimeout(() => {
        setIsCreateLessonDialogOpen(false)
        setUploadStatus('idle')
        setUploadProgress(0)
        setUploadStatusMsg('')
        setLessonFormData({ title: '', description: '', order: 1, isPreview: false, videoFile: null, thumbnailFile: null })
        setLessonThumbnailPreview(null)
        setSelectedSubCourse(null)
        setIsCreatingLesson(false)
        setIsUploadingInBackground(false)
      }, 1800)

    } catch (error) {
      console.error('Upload failed:', error)
      const msg = error instanceof Error ? error.message : 'Алдаа гарлаа. Дахин оролдоно уу.'
      setUploadStatus('error')
      setUploadError(msg)
      setUploadStatusMsg('')
      setIsCreatingLesson(false)
      setIsUploadingInBackground(false)
    }
  }

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm("Delete lesson?")) return
    try {
      const res = await fetch(`/api/admin/lessons/${lessonId}`, { 
        method: "DELETE",
        credentials: 'include'
      })
      if (res.ok) {
        const subCourseId = lessons.find(l => l._id === lessonId)?.subCourseId
        if (subCourseId) {
          const lessonsData = await fetchLessons(subCourseId)
          setLessons(prev => {
            const filtered = prev.filter(l => l.subCourseId !== subCourseId)
            return [...filtered, ...lessonsData]
          })
        } else {
          setLessons(prev => prev.filter(l => l._id !== lessonId))
        }
        toast({ title: "Deleted", description: "Lesson deleted" })
      } else {
        const err = await res.json()
        toast({ title: "Error", description: err.error || "Failed", variant: "destructive" })
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to delete lesson", variant: "destructive" })
    }
  }

  const getCourseSubCourses = (courseId: string) => subCourses.filter(sc => sc.courseId === courseId).sort((a, b) => a.order - b.order)
  const getSubCourseLessons = (subCourseId: string) => lessons.filter(l => l.subCourseId === subCourseId)

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Хичээл удирдах</h1>
        <p className="text-gray-600">Хичээлүүдийг нэмэх, засах, устгах</p>
      </div>

      {/* Upload Status Banner */}
      {isUploadingInBackground && uploadStatus !== 'idle' && (
        <div className={`p-4 rounded-xl border ${
          uploadStatus === 'done' ? 'bg-green-50 border-green-200' :
          uploadStatus === 'error' ? 'bg-red-50 border-red-200' :
          'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-center gap-3">
            {uploadStatus === 'done' ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            ) : uploadStatus === 'error' ? (
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            ) : (
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className={`font-medium text-sm ${
                uploadStatus === 'done' ? 'text-green-800' :
                uploadStatus === 'error' ? 'text-red-700' : 'text-blue-800'
              }`}>
                {uploadStatus === 'done' ? 'Хичээл амжилттай нэмэгдлээ!' :
                 uploadStatus === 'error' ? 'Байршуулалт амжилтгүй боллоо' :
                 uploadStatusMsg}
              </p>
              {uploadStatus === 'uploading' && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-blue-600 mb-1">
                    <span>Байршуулж байна</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-blue-100 rounded-full h-1.5">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Хичээлүүд ({courses.length})</CardTitle>
            <Dialog open={isCreateCourseDialogOpen} onOpenChange={setIsCreateCourseDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Шинэ хичээл
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Шинэ хичээл үүсгэх</DialogTitle>
                  <DialogDescription>
                    Доорх мэдээллийг бөглөж шинэ хичээл үүсгэнэ үү.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="courseTitle">Гарчиг</Label>
                      <Input
                        id="courseTitle"
                        value={courseFormData.title}
                        onChange={(e) => setCourseFormData({ ...courseFormData, title: e.target.value })}
                        placeholder="Хичээлийн гарчиг оруулна уу"
                      />
                    </div>
                    <div>
                      <Label htmlFor="courseCategory">Ангилал</Label>
                      <Input
                        id="courseCategory"
                        value={courseFormData.category}
                        onChange={(e) => setCourseFormData({ ...courseFormData, category: e.target.value })}
                        placeholder="Хичээлийн ангилал оруулна уу"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="courseDescription">Тайлбар</Label>
                    <Textarea
                      id="courseDescription"
                      value={courseFormData.description}
                      onChange={(e) => setCourseFormData({ ...courseFormData, description: e.target.value })}
                      placeholder="Хичээлийн тайлбар оруулна уу"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="courseThumbnail">Хичээлийн зураг (Заавал биш)</Label>
                    <div className="mt-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <Input
                          id="courseThumbnail"
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null
                            setCourseFormData({ ...courseFormData, thumbnailFile: file })
                            if (file) {
                              const reader = new FileReader()
                              reader.onload = (e) => setThumbnailPreview(e.target?.result as string)
                              reader.readAsDataURL(file)
                            } else {
                              setThumbnailPreview(null)
                            }
                          }}
                          className="flex-1"
                          disabled={thumbnailUploadLoading}
                        />
                        {courseFormData.thumbnailFile && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setCourseFormData({ ...courseFormData, thumbnailFile: null })
                              setThumbnailPreview(null)
                              const fileInput = document.getElementById('courseThumbnail') as HTMLInputElement
                              if (fileInput) fileInput.value = ''
                            }}
                          >
                            Устгах
                          </Button>
                        )}
                      </div>

                      {thumbnailPreview && (
                        <div className="flex items-start gap-3 p-3 border rounded-lg bg-muted/20">
                          <img
                            src={thumbnailPreview}
                            alt="Зургийн урьдчилсан харагдац"
                            className="w-24 h-24 object-cover rounded-lg border"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">
                              {courseFormData.thumbnailFile?.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {courseFormData.thumbnailFile ? (courseFormData.thumbnailFile.size / 1024 / 1024).toFixed(2) + ' MB' : ''}
                            </p>
                            <p className="text-xs text-green-600 mt-1">
                              ✓ Cloudinary рүү байршуулахад бэлэн
                            </p>
                          </div>
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground">
                        Дэмжигддэг форматууд: JPEG, PNG, WebP, GIF. Хамгийн их хэмжээ: 10MB.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="coursePrice">Үнэ (₮)</Label>
                      <Input
                        id="coursePrice"
                        type="number"
                        value={courseFormData.price}
                        onChange={(e) => setCourseFormData({ ...courseFormData, price: parseInt(e.target.value) || 0 })}
                        placeholder="Үнэ оруулна уу"
                      />
                    </div>
                    <div>
                      <Label htmlFor="courseOriginalPrice">Анхны үнэ (₮)</Label>
                      <Input
                        id="courseOriginalPrice"
                        type="number"
                        value={courseFormData.originalPrice}
                        onChange={(e) => setCourseFormData({ ...courseFormData, originalPrice: parseInt(e.target.value) || 0 })}
                        placeholder="Анхны үнэ оруулна уу"
                      />
                    </div>
                    <div>
                      <Label htmlFor="courseAccess">⏱ Хандах хугацаа (сар)</Label>
                      <Input
                        id="courseAccess"
                        type="number"
                        min={0}
                        max={12}
                        value={courseFormData.accessDurationMonths ?? 0}
                        onChange={(e) => {
                          const v = parseInt(e.target.value) || 0
                          setCourseFormData({ ...courseFormData, accessDurationMonths: v === 0 ? null : v })
                        }}
                        placeholder="0 = насан туршид"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {!courseFormData.accessDurationMonths ? "♾ Насан туршид" : `⏱ ${courseFormData.accessDurationMonths} сар`}
                      </p>
                    </div>
                    <div>
                      <Label>Түвшин</Label>
                      <div className="flex gap-2 mt-1">
                        {(["beginner", "intermediate", "advanced"] as const).map((lvl) => (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => setCourseFormData({ ...courseFormData, level: lvl })}
                            className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition-all ${
                              courseFormData.level === lvl
                                ? "bg-blue-600 text-white border-blue-600"
                                : "border-gray-300 text-gray-700 hover:border-blue-400"
                            }`}
                          >
                            {lvl === "beginner" ? "Анхан" : lvl === "intermediate" ? "Дунд" : "Ахисан"}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Button onClick={handleCreateCourse} className="w-full" disabled={thumbnailUploadLoading}>
                    {thumbnailUploadLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        {courseFormData.thumbnailFile ? "Зураг байршуулж байна..." : "Хичээл үүсгэж байна..."}
                      </div>
                    ) : (
                      "Хичээл үүсгэх"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Q Хичээл хайх..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredCourses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No courses found</div>
            ) : (
              filteredCourses.map((course) => (
                <div key={course._id} className="border rounded-lg">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <BookOpen className="h-8 w-8 text-blue-600" />
                      <div>
                        <h3 className="font-medium text-lg">{course.title}</h3>
                        <p className="text-sm text-gray-500">{course.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>Үнэ: ₮{course.price}</span>
                          <span>Дэд хичээл: {getCourseSubCourses(course._id).length}</span>
                          <span>Сурагчид: {course.enrolledCount}</span>
                          <span className="font-semibold text-blue-600">
                            {course.accessDurationMonths
                              ? `⏱ ${course.accessDurationMonths} сар`
                              : "♾ Насан туршид"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="font-medium">₮{course.price}</div>
                        <Badge variant={course.isActive ? "default" : "secondary"}>
                          {course.isActive ? "Идэвхтэй" : "Идэвхгүй"}
                        </Badge>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => toggleCourseExpansion(course._id)}>
                        {expandedCourses.has(course._id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCourse(course)
                          setEditCourseFormData({
                            title: course.title,
                            description: course.description,
                            price: course.price,
                            originalPrice: course.originalPrice || 0,
                            accessDurationMonths: course.accessDurationMonths ?? null,
                            category: course.category,
                            level: course.level,
                            isActive: course.isActive,
                            thumbnailFile: null
                          })
                          setIsEditCourseDialogOpen(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <Button variant="outline" size="sm" onClick={() => handleDeleteCourse(course._id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {expandedCourses.has(course._id) && (
                    <div className="border-t bg-gray-50 p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-primary" />
                          <h4 className="font-medium text-gray-800">Дэд хичээлүүд ({getCourseSubCourses(course._id).length})</h4>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedCourse(course)
                              setIsCreateSubCourseDialogOpen(true)
                            }}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Дэд хичээл нэмэх
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                const res = await fetch('/api/admin/fix-lesson-orders', {
                                  method: 'POST',
                                  credentials: 'include'
                                })
                                if (res.ok) {
                                  const data = await res.json()
                                  toast({ title: "Success", description: data.message })
                                  // Refresh data
                                  loadData()
                                } else {
                                  toast({ title: "Error", description: "Failed to fix lesson orders", variant: "destructive" })
                                }
                              } catch (e) {
                                toast({ title: "Error", description: "Failed to fix lesson orders", variant: "destructive" })
                              }
                            }}
                          >
                            🔢 Fix Orders
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {getCourseSubCourses(course._id).length === 0 ? (
                          <div className="text-center py-6 text-gray-500">
                            <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                            <p className="mb-3">No sub-courses found</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedCourse(course)
                                setIsCreateSubCourseDialogOpen(true)
                              }}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Create First Sub-course
                            </Button>
                          </div>
                        ) : (
                          getCourseSubCourses(course._id).map((subCourse) => (
                            <div key={subCourse._id} className="bg-white rounded border">
                              <div className="flex items-center justify-between p-3">
                                <div className="flex items-center gap-3">
                                  <BookOpen className="h-5 w-5 text-green-600" />
                                  <div>
                                    <h5 className="font-medium">{subCourse.title}</h5>
                                    <p className="text-sm text-gray-500">{subCourse.description}</p>
                                    <p className="text-xs text-gray-500">Order: {subCourse.order}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button variant="outline" size="sm" onClick={() => toggleSubCourseExpansion(subCourse._id)}>
                                    {expandedSubCourses.has(subCourse._id) ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedSubCourse(subCourse)
                                      setEditSubCourseFormData({
                                        title: subCourse.title,
                                        description: subCourse.description,
                                        order: subCourse.order,
                                        isActive: subCourse.isActive
                                      })
                                      setIsEditSubCourseDialogOpen(true)
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={() => handleDeleteSubCourse(subCourse._id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              {expandedSubCourses.has(subCourse._id) && (
                                <div className="border-t bg-gray-25 p-3">
                                  <div className="flex items-center justify-between mb-3">
                                    <h6 className="font-medium text-sm text-gray-700">
                                      Хичээлүүд ({getSubCourseLessons(subCourse._id).length})
                                    </h6>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedSubCourse(subCourse)
                                        // Calculate next order number for this subcourse
                                        const existingLessons = lessons.filter(l => l.subCourseId === subCourse._id)
                                        const nextOrder = existingLessons.length > 0 ? Math.max(...existingLessons.map(l => l.order)) + 1 : 1
                                        setLessonFormData(prev => ({ ...prev, order: nextOrder }))
                                        setIsCreateLessonDialogOpen(true)
                                      }}
                                    >
                                      <Plus className="h-4 w-4 mr-2" />
                                      Хичээл нэмэх
                                    </Button>
                                  </div>
                                  <div className="space-y-2">
                                    {getSubCourseLessons(subCourse._id).length === 0 ? (
                                      <div className="text-center py-3 text-gray-500 text-sm">
                                        <Video className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                        <p>No lessons found</p>
                                      </div>
                                    ) : (
                                      getSubCourseLessons(subCourse._id)
                                        .sort((a, b) => a.order - b.order)
                                        .map((lesson) => (
                                          <div key={lesson._id} className="flex items-center justify-between p-2 bg-white rounded border text-sm">
                                            <div className="flex items-center gap-2">
                                              <Video className="h-4 w-4 text-blue-600" />
                                              <div>
                                                <p className="font-medium">{lesson.title}</p>
                                                <p className="text-xs text-gray-500">{lesson.description}</p>
                                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                                  <span>Order: {lesson.order}</span>
                                                  <span>•</span>
                                                  <span>{lesson.duration} мин</span>
                                                  {lesson.isPreview && (
                                                    <>
                                                      <span>•</span>
                                                      <Badge variant="secondary" className="text-xs">Preview</Badge>
                                                    </>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                  setSelectedLesson(lesson)
                                                  setEditLessonFormData({
                                                    title: lesson.title,
                                                    description: lesson.description,
                                                    order: lesson.order,
                                                    isPreview: lesson.isPreview,
                                                    thumbnailUrl: lesson.thumbnailUrl || "",
                                                    thumbnailFile: null
                                                  })
                                                  setEditLessonThumbnailPreview(lesson.thumbnailUrl || null)
                                                  setIsEditLessonDialogOpen(true)
                                                }}
                                              >
                                                <Edit className="h-3 w-3" />
                                              </Button>
                                              <Button variant="ghost" size="sm" onClick={() => handleDeleteLesson(lesson._id)}>
                                                <Trash2 className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          </div>
                                        ))
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isCreateSubCourseDialogOpen} onOpenChange={setIsCreateSubCourseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Шинэ дэд хичээл үүсгэх</DialogTitle>
            <DialogDescription>
              Доорх мэдээллийг бөглөж шинэ дэд хичээл үүсгэнэ үү.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="subCourseTitle">Гарчиг</Label>
              <Input
                id="subCourseTitle"
                value={subCourseFormData.title}
                onChange={(e) => setSubCourseFormData({ ...subCourseFormData, title: e.target.value })}
                placeholder="Дэд хичээлийн гарчиг оруулна уу"
              />
            </div>
            <div>
              <Label htmlFor="subCourseDescription">Тайлбар</Label>
              <Textarea
                id="subCourseDescription"
                value={subCourseFormData.description}
                onChange={(e) => setSubCourseFormData({ ...subCourseFormData, description: e.target.value })}
                placeholder="Дэд хичээлийн тайлбар оруулна уу"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subCourseOrder">Дараалал</Label>
                <Input
                  id="subCourseOrder"
                  type="number"
                  value={subCourseFormData.order}
                  onChange={(e) => setSubCourseFormData({ ...subCourseFormData, order: parseInt(e.target.value) || 1 })}
                  placeholder="Дараалал оруулна уу"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="subCourseActive"
                  checked={subCourseFormData.isActive}
                  onCheckedChange={(checked) => setSubCourseFormData({ ...subCourseFormData, isActive: checked })}
                />
                <Label htmlFor="subCourseActive">Идэвхтэй</Label>
              </div>
            </div>
            <Button onClick={handleCreateSubCourse} className="w-full">Дэд хичээл үүсгэх</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Course Dialog */}
      <Dialog open={isEditCourseDialogOpen} onOpenChange={setIsEditCourseDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription>
              Edit the course information below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editCourseTitle">Title</Label>
                <Input
                  id="editCourseTitle"
                  value={editCourseFormData.title}
                  onChange={(e) => setEditCourseFormData({ ...editCourseFormData, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="editCourseCategory">Category</Label>
                <Input
                  id="editCourseCategory"
                  value={editCourseFormData.category}
                  onChange={(e) => setEditCourseFormData({ ...editCourseFormData, category: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="editCourseDescription">Description</Label>
              <Textarea
                id="editCourseDescription"
                value={editCourseFormData.description}
                onChange={(e) => setEditCourseFormData({ ...editCourseFormData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="editCoursePrice">Үнэ (₮)</Label>
                <Input
                  id="editCoursePrice"
                  type="number"
                  value={editCourseFormData.price}
                  onChange={(e) => setEditCourseFormData({ ...editCourseFormData, price: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="editCourseOriginalPrice">Анхны үнэ (₮)</Label>
                <Input
                  id="editCourseOriginalPrice"
                  type="number"
                  value={editCourseFormData.originalPrice}
                  onChange={(e) => setEditCourseFormData({ ...editCourseFormData, originalPrice: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="editCourseAccess">⏱ Хандах хугацаа (сар)</Label>
                <Input
                  id="editCourseAccess"
                  type="number"
                  min={0}
                  max={12}
                  value={editCourseFormData.accessDurationMonths ?? 0}
                  onChange={(e) => {
                    const v = parseInt(e.target.value) || 0
                    setEditCourseFormData({ ...editCourseFormData, accessDurationMonths: v === 0 ? null : v })
                  }}
                  placeholder="0 = насан туршид"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {!editCourseFormData.accessDurationMonths ? "♾ Насан туршид" : `⏱ ${editCourseFormData.accessDurationMonths} сар`}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="editCourseLevel">Түвшин</Label>
                <div className="flex gap-2 mt-1">
                  {(["beginner", "intermediate", "advanced"] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setEditCourseFormData({ ...editCourseFormData, level: lvl })}
                      className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition-all ${
                        editCourseFormData.level === lvl
                          ? "bg-blue-600 text-white border-blue-600"
                          : "border-gray-300 text-gray-700 hover:border-blue-400"
                      }`}
                    >
                      {lvl === "beginner" ? "Анхан" : lvl === "intermediate" ? "Дунд" : "Ахисан"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="editCourseActive"
                checked={editCourseFormData.isActive}
                onCheckedChange={(checked) => setEditCourseFormData({ ...editCourseFormData, isActive: checked })}
              />
              <Label htmlFor="editCourseActive">Active</Label>
            </div>
            <Button onClick={handleUpdateCourse} className="w-full">Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Lesson Dialog */}
      <Dialog open={isEditLessonDialogOpen} onOpenChange={setIsEditLessonDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-4 h-4 text-blue-600" />
              Хичээл засах
            </DialogTitle>
            {selectedLesson && (
              <p className="text-xs text-muted-foreground truncate">ID: {selectedLesson._id}</p>
            )}
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div>
              <Label htmlFor="editLessonTitle">Гарчиг</Label>
              <Input
                id="editLessonTitle"
                value={editLessonFormData.title}
                onChange={(e) => setEditLessonFormData({ ...editLessonFormData, title: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="editLessonDescription">Тайлбар</Label>
              <Textarea
                id="editLessonDescription"
                value={editLessonFormData.description}
                onChange={(e) => setEditLessonFormData({ ...editLessonFormData, description: e.target.value })}
                rows={2}
                className="mt-1"
              />
            </div>
            {/* Edit Thumbnail */}
            <div>
              <Label>Thumbnail зураг</Label>
              {editLessonThumbnailPreview || editLessonFormData.thumbnailUrl ? (
                <div className="mt-1 flex items-center gap-3 p-3 bg-muted/30 border rounded-lg">
                  <img
                    src={editLessonThumbnailPreview || editLessonFormData.thumbnailUrl}
                    alt="thumbnail"
                    className="w-16 h-10 object-cover rounded border"
                  />
                  <div className="flex-1 min-w-0">
                    {editLessonFormData.thumbnailFile ? (
                      <>
                        <p className="text-sm font-medium truncate">{editLessonFormData.thumbnailFile.name}</p>
                        <p className="text-xs text-blue-600">Шинэ зураг сонгогдсон</p>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground">Одоогийн thumbnail</p>
                    )}
                  </div>
                  <label htmlFor="editLessonThumbnail" className="cursor-pointer text-xs text-blue-600 hover:underline shrink-0">
                    Солих
                    <input
                      id="editLessonThumbnail"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null
                        setEditLessonFormData({ ...editLessonFormData, thumbnailFile: file })
                        if (file) {
                          const reader = new FileReader()
                          reader.onload = (ev) => setEditLessonThumbnailPreview(ev.target?.result as string)
                          reader.readAsDataURL(file)
                        }
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setEditLessonFormData({ ...editLessonFormData, thumbnailFile: null, thumbnailUrl: "" })
                      setEditLessonThumbnailPreview(null)
                    }}
                    className="p-1 rounded-full hover:bg-muted text-muted-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="editLessonThumbnail"
                  className="mt-1 flex items-center gap-3 p-3 border-2 border-dashed border-muted-foreground/20 rounded-lg cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
                >
                  <div className="w-8 h-8 bg-muted rounded flex items-center justify-center shrink-0">
                    <Upload className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Зураг сонгох</p>
                    <p className="text-xs text-muted-foreground">JPEG, PNG, WebP</p>
                  </div>
                  <input
                    id="editLessonThumbnail"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null
                      setEditLessonFormData({ ...editLessonFormData, thumbnailFile: file })
                      if (file) {
                        const reader = new FileReader()
                        reader.onload = (ev) => setEditLessonThumbnailPreview(ev.target?.result as string)
                        reader.readAsDataURL(file)
                      }
                    }}
                  />
                </label>
              )}
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
              <div>
                <p className="text-sm font-medium">Үнэгүй үзэх</p>
                <p className="text-xs text-muted-foreground">Бүртгэлгүй хэрэглэгч үзэж болно</p>
              </div>
              <Switch
                id="editLessonPreview"
                checked={editLessonFormData.isPreview}
                onCheckedChange={(checked) => setEditLessonFormData({ ...editLessonFormData, isPreview: checked })}
              />
            </div>
            <Button
              className="w-full h-11"
              onClick={async () => {
                if (!selectedLesson) return
                try {
                  // Upload new thumbnail if provided
                  let finalThumbnailUrl = editLessonFormData.thumbnailUrl
                  if (editLessonFormData.thumbnailFile) {
                    const thumbForm = new FormData()
                    thumbForm.append('file', editLessonFormData.thumbnailFile)
                    thumbForm.append('name', `${editLessonFormData.title || 'lesson'}_thumbnail`)
                    thumbForm.append('description', `Thumbnail for lesson: ${editLessonFormData.title}`)
                    const thumbRes = await fetch('/api/admin/media', {
                      method: 'POST',
                      credentials: 'include',
                      body: thumbForm
                    })
                    if (thumbRes.ok) {
                      const thumbData = await thumbRes.json()
                      finalThumbnailUrl = thumbData.mediaItem?.cloudinarySecureUrl || thumbData.mediaItem?.cloudinaryUrl || finalThumbnailUrl
                    }
                  }
                  const { thumbnailFile: _tf, ...dataToSend } = editLessonFormData
                  const res = await fetch(`/api/admin/lessons/${selectedLesson._id}`, {
                    method: "PUT",
                    credentials: 'include',
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...dataToSend, thumbnailUrl: finalThumbnailUrl })
                  })
                  if (res.ok) {
                    const subCourseId = selectedLesson.subCourseId
                    if (subCourseId) {
                      const lessonsData = await fetchLessons(subCourseId)
                      setLessons(prev => {
                        const filtered = prev.filter(l => l.subCourseId !== subCourseId)
                        return [...filtered, ...lessonsData]
                      })
                    }
                    setIsEditLessonDialogOpen(false)
                    setSelectedLesson(null)
                    setEditLessonThumbnailPreview(null)
                    toast({ title: "Updated", description: "Lesson updated" })
                  } else {
                    const err = await res.json()
                    toast({ title: "Error", description: err.error || "Failed", variant: "destructive" })
                  }
                } catch (e) {
                  toast({ title: "Error", description: "Failed to update lesson", variant: "destructive" })
                }
              }}
            >
              Хадгалах
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Sub-Course Dialog */}
      <Dialog open={isEditSubCourseDialogOpen} onOpenChange={setIsEditSubCourseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Sub-Course</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editSubCourseTitle">Title</Label>
              <Input
                id="editSubCourseTitle"
                value={editSubCourseFormData.title}
                onChange={(e) => setEditSubCourseFormData({ ...editSubCourseFormData, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="editSubCourseDescription">Description</Label>
              <Textarea
                id="editSubCourseDescription"
                value={editSubCourseFormData.description}
                onChange={(e) => setEditSubCourseFormData({ ...editSubCourseFormData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editSubCourseOrder">Order</Label>
                <Input
                  id="editSubCourseOrder"
                  type="number"
                  value={editSubCourseFormData.order}
                  onChange={(e) => setEditSubCourseFormData({ ...editSubCourseFormData, order: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="editSubCourseActive"
                  checked={editSubCourseFormData.isActive}
                  onCheckedChange={(checked) => setEditSubCourseFormData({ ...editSubCourseFormData, isActive: checked })}
                />
                <Label htmlFor="editSubCourseActive">Active</Label>
              </div>
            </div>
            <Button onClick={handleUpdateSubCourse} className="w-full">Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isCreateLessonDialogOpen}
        onOpenChange={(open) => {
          if (!isCreatingLesson) {
            setIsCreateLessonDialogOpen(open)
            if (!open) {
              setUploadStatus('idle')
              setUploadProgress(0)
              setUploadError('')
              setUploadStatusMsg('')
              setLessonThumbnailPreview(null)
            }
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Video className="w-5 h-5 text-blue-600" />
              Шинэ хичээл нэмэх
            </DialogTitle>
            {selectedSubCourse && (
              <p className="text-sm text-muted-foreground">
                Дэд хичээл: <span className="font-medium text-foreground">{selectedSubCourse.title}</span>
              </p>
            )}
          </DialogHeader>

          {/* Upload progress view */}
          {uploadStatus !== 'idle' && uploadStatus !== 'error' ? (
            <div className="py-6 space-y-6">
              {/* Steps */}
              <div className="space-y-3">
                {[
                  { key: 'initializing', label: 'Холболт үүсгэж байна', desc: 'Bunny.net рүү холбогдож байна' },
                  { key: 'uploading',    label: 'Видео байршуулж байна', desc: lessonFormData.videoFile ? `${lessonFormData.videoFile.name} · ${(lessonFormData.videoFile.size / 1024 / 1024).toFixed(1)} MB` : '' },
                  { key: 'creating',     label: 'Хичээл хадгалж байна',  desc: 'Мэдээллийн санд нэмж байна' },
                  { key: 'done',         label: 'Амжилттай!',            desc: 'Хичээл нэмэгдлээ' },
                ].map((step, i) => {
                  const statuses = ['initializing', 'uploading', 'creating', 'done']
                  const currentIdx = statuses.indexOf(uploadStatus)
                  const stepIdx = statuses.indexOf(step.key)
                  const isDone = stepIdx < currentIdx || uploadStatus === 'done'
                  const isActive = step.key === uploadStatus
                  return (
                    <div key={step.key} className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                      isActive ? 'bg-blue-50 border border-blue-200' :
                      isDone  ? 'bg-green-50 border border-green-100 opacity-70' :
                      'opacity-30'
                    }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-blue-600' : isDone ? 'bg-green-500' : 'bg-gray-200'
                      }`}>
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        ) : isActive ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <span className="text-xs font-bold text-gray-500">{i + 1}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${isActive ? 'text-blue-800' : isDone ? 'text-green-800' : 'text-gray-400'}`}>
                          {step.label}
                        </p>
                        <p className={`text-xs truncate ${isActive ? 'text-blue-600' : isDone ? 'text-green-600' : 'text-gray-400'}`}>
                          {step.desc}
                        </p>
                      </div>
                      {isActive && step.key === 'uploading' && (
                        <span className="text-sm font-bold text-blue-700 tabular-nums">{uploadProgress}%</span>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Progress bar — only during upload */}
              {uploadStatus === 'uploading' && (
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                    <span>Байршуулсан</span>
                    <span>
                      {lessonFormData.videoFile
                        ? `${((lessonFormData.videoFile.size * uploadProgress) / 100 / 1024 / 1024).toFixed(1)} MB / ${(lessonFormData.videoFile.size / 1024 / 1024).toFixed(1)} MB`
                        : `${uploadProgress}%`}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                    <div
                      className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {uploadStatus === 'done' && (
                <div className="flex items-center justify-center gap-2 text-green-600 font-semibold py-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Хичээл амжилттай нэмэгдлээ!
                </div>
              )}
            </div>
          ) : (
            /* Normal form */
            <div className="space-y-4 pt-1">
              {uploadStatus === 'error' && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-700">Байршуулалт амжилтгүй боллоо</p>
                    <p className="text-xs text-red-600 mt-0.5">{uploadError}</p>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="lessonTitle">Гарчиг <span className="text-red-500">*</span></Label>
                <Input
                  id="lessonTitle"
                  value={lessonFormData.title}
                  onChange={(e) => setLessonFormData({ ...lessonFormData, title: e.target.value })}
                  placeholder="Хичээлийн гарчиг"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="lessonDescription">Тайлбар</Label>
                <Textarea
                  id="lessonDescription"
                  value={lessonFormData.description}
                  onChange={(e) => setLessonFormData({ ...lessonFormData, description: e.target.value })}
                  placeholder="Хичээлийн товч тайлбар (заавал биш)"
                  rows={2}
                  className="mt-1"
                />
              </div>

              {/* Video file drop zone */}
              <div>
                <Label>Видео файл <span className="text-red-500">*</span></Label>
                {lessonFormData.videoFile ? (
                  <div className="mt-1 flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
                      <FileVideo className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-blue-900 truncate">{lessonFormData.videoFile.name}</p>
                      <p className="text-xs text-blue-600">{(lessonFormData.videoFile.size / 1024 / 1024).toFixed(2)} MB · {lessonFormData.videoFile.type || 'video'}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLessonFormData({ ...lessonFormData, videoFile: null })}
                      className="p-1 rounded-full hover:bg-blue-100 text-blue-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="lessonVideo"
                    className="mt-1 flex flex-col items-center gap-2 p-6 border-2 border-dashed border-muted-foreground/30 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
                  >
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">Файл сонгох</p>
                      <p className="text-xs text-muted-foreground mt-0.5">MP4, MOV, AVI, WebM · Хэмжээний хязгааргүй</p>
                    </div>
                    <input
                      id="lessonVideo"
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null
                        setLessonFormData({ ...lessonFormData, videoFile: file })
                      }}
                    />
                  </label>
                )}
              </div>

              {/* Thumbnail */}
              <div>
                <Label>Thumbnail зураг <span className="text-muted-foreground text-xs">(заавал биш)</span></Label>
                {lessonThumbnailPreview ? (
                  <div className="mt-1 flex items-center gap-3 p-3 bg-muted/30 border rounded-lg">
                    <img src={lessonThumbnailPreview} alt="thumbnail" className="w-16 h-10 object-cover rounded border" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{lessonFormData.thumbnailFile?.name}</p>
                      <p className="text-xs text-muted-foreground">{lessonFormData.thumbnailFile ? (lessonFormData.thumbnailFile.size / 1024 / 1024).toFixed(2) + ' MB' : ''}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setLessonFormData({ ...lessonFormData, thumbnailFile: null }); setLessonThumbnailPreview(null) }}
                      className="p-1 rounded-full hover:bg-muted text-muted-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="lessonThumbnail"
                    className="mt-1 flex items-center gap-3 p-3 border-2 border-dashed border-muted-foreground/20 rounded-lg cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
                  >
                    <div className="w-8 h-8 bg-muted rounded flex items-center justify-center shrink-0">
                      <Upload className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Зураг сонгох</p>
                      <p className="text-xs text-muted-foreground">JPEG, PNG, WebP · Хичээлийн cover зураг</p>
                    </div>
                    <input
                      id="lessonThumbnail"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null
                        setLessonFormData({ ...lessonFormData, thumbnailFile: file })
                        if (file) {
                          const reader = new FileReader()
                          reader.onload = (ev) => setLessonThumbnailPreview(ev.target?.result as string)
                          reader.readAsDataURL(file)
                        } else setLessonThumbnailPreview(null)
                      }}
                    />
                  </label>
                )}
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Үнэгүй үзэх</p>
                  <p className="text-xs text-muted-foreground">Бүртгэлгүй хэрэглэгч үзэж болно</p>
                </div>
                <Switch
                  id="lessonPreview"
                  checked={lessonFormData.isPreview}
                  onCheckedChange={(checked) => setLessonFormData({ ...lessonFormData, isPreview: checked })}
                />
              </div>

              <Button
                onClick={handleCreateLesson}
                className="w-full h-11 text-base font-semibold"
                disabled={isCreatingLesson || !lessonFormData.videoFile || !lessonFormData.title}
              >
                <Upload className="w-4 h-4 mr-2" />
                Байршуулах
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
