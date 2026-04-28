"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  Save,
  X,
  Settings
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface MediaItem {
  _id?: string
  id?: string
  name: string
  description?: string
  type: string
  size: number
  originalName?: string
  uploadedBy?: string
  status: string
  createdAt?: string
  updatedAt?: string
  cloudinarySecureUrl?: string // Added for Cloudinary URL
}

interface PlacedImage {
  id: string
  mediaId: string
  media: MediaItem
  x: number
  y: number
  width: number
  height: number
  zIndex: number
}

interface CanvasLayout {
  id: string
  name: string
  canvasWidth: number
  canvasHeight: number
  images: PlacedImage[]
  isPublished: boolean
  isLive: boolean
  lastSaved: string
}

export default function AdminMediaGrid() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [canvasLayout, setCanvasLayout] = useState<CanvasLayout>({
    id: "default",
    name: "Main Canvas",
    canvasWidth: 1200,
    canvasHeight: 800,
    images: [],
    isPublished: true,
    isLive: false,
    lastSaved: new Date().toISOString()
  })
  const [uploadForm, setUploadForm] = useState({ name: '', description: '', file: null as File | null })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)
  const [selectedImage, setSelectedImage] = useState<PlacedImage | null>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [canvasSettings, setCanvasSettings] = useState({
    width: 1200,
    height: 800
  })
  const [isMovingImage, setIsMovingImage] = useState(false)
  const [moveOffset, setMoveOffset] = useState({ x: 0, y: 0 })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    checkAuth()
  }, [])

  // Global mouse move handler for smooth image moving
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isMovingImage && selectedImage) {
        console.log('Global mousemove: Moving image', selectedImage.media.name)
        const canvasElement = document.querySelector('[data-canvas]') as HTMLElement
        if (canvasElement) {
          const rect = canvasElement.getBoundingClientRect()
          const newX = e.clientX - rect.left - moveOffset.x
          const newY = e.clientY - rect.top - moveOffset.y

          console.log('New position:', { newX, newY, moveOffset })

          // Constrain to canvas bounds
          const constrainedX = Math.max(0, Math.min(newX, canvasLayout.canvasWidth - selectedImage.width))
          const constrainedY = Math.max(0, Math.min(newY, canvasLayout.canvasHeight - selectedImage.height))

          console.log('Constrained position:', { constrainedX, constrainedY })

          setCanvasLayout(prev => ({
            ...prev,
            images: prev.images.map(img =>
              img.id === selectedImage.id
                ? { ...img, x: constrainedX, y: constrainedY }
                : img
            )
          }))
        }
      }
    }

    const handleGlobalMouseUp = () => {
      setIsMovingImage(false)
    }

    if (isMovingImage) {
      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)
      // Prevent text selection while moving
      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'grabbing'
    } else {
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
  }, [isMovingImage, selectedImage, moveOffset, canvasLayout.canvasWidth, canvasLayout.canvasHeight])

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

      fetchMediaItems()
      fetchCanvasLayout()
    } catch (error) {
      console.error("Auth error:", error)
      router.push("/admin/login")
    }
  }

  const fetchMediaItems = async () => {
    try {
      const response = await fetch("/api/admin/media")
      if (response.ok) {
        const data = await response.json()
        setMediaItems(data.mediaItems || [])
      } else {
        console.error("Failed to fetch media items")
        setMediaItems([])
      }
    } catch (error) {
      console.error("Error fetching media items:", error)
      setMediaItems([])
    } finally {
      setLoading(false)
    }
  }

  const fetchCanvasLayout = async () => {
    try {
      const response = await fetch("/api/admin/media-grid/layout")
      if (response.ok) {
        const data = await response.json()
        if (data.layout) {
          // Check if layout has images array (new format) or cells array (old format)
          if (data.layout.images && Array.isArray(data.layout.images)) {
            // New canvas format - use directly
            setCanvasLayout({
              id: data.layout.id || "default",
              name: data.layout.name || "Main Canvas",
              canvasWidth: data.layout.canvasWidth || 800,
              canvasHeight: data.layout.canvasHeight || 400,
              images: data.layout.images,
              isPublished: data.layout.isPublished || true,
              isLive: data.layout.isLive || false,
              lastSaved: data.layout.lastSaved || new Date().toISOString()
            })
            setCanvasSettings({
              width: data.layout.canvasWidth || 800,
              height: data.layout.canvasHeight || 400
            })
          } else if (data.layout.cells) {
            // Old grid format - convert to new canvas format
            const images = data.layout.cells
              .filter((cell: any) => cell.mediaId && cell.media)
              .map((cell: any, index: number) => ({
                id: `img-${index}`,
                mediaId: cell.mediaId,
                media: cell.media,
                x: cell.x * 100,
                y: cell.y * 100,
                width: (cell.spanX || 1) * 100,
                height: (cell.spanY || 1) * 100,
                zIndex: index
              }))

            setCanvasLayout(prev => ({
              ...prev,
              images,
              canvasWidth: (data.layout.width || 6) * 100,
              canvasHeight: (data.layout.height || 4) * 100
            }))
            setCanvasSettings({
              width: (data.layout.width || 6) * 100,
              height: (data.layout.height || 4) * 100
            })
          } else {
            // No images or cells - initialize empty canvas
            initializeCanvas()
          }
        } else {
          initializeCanvas()
        }
      } else {
        initializeCanvas()
      }
    } catch (error) {
      console.error("Error fetching canvas layout:", error)
      initializeCanvas()
    }
  }

  const initializeCanvas = () => {
    setCanvasLayout(prev => ({
      ...prev,
      images: [],
      canvasWidth: 1200,
      canvasHeight: 800
    }))
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setUploadForm(prev => ({ ...prev, file, name: file.name }))
    }
  }

  const handleUpload = async () => {
    if (!uploadForm.file) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive"
      })
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', uploadForm.file)
      formData.append('name', uploadForm.name)
      formData.append('description', uploadForm.description)

      const response = await fetch("/api/admin/media", {
        method: "POST",
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Success",
          description: "Media uploaded successfully"
        })

        // Add new media item to the list
        const newMediaItem = { ...data.mediaItem, id: data.mediaId }
        setMediaItems(prev => [newMediaItem, ...prev])

        // Reset form and close dialog
        setUploadForm({ name: '', description: '', file: null })
        setShowUploadDialog(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to upload media",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Error",
        description: "Failed to upload media",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  const handleMediaClick = (mediaItem: MediaItem) => {
    setSelectedMedia(mediaItem)
  }



  const handleImageSelect = (image: PlacedImage) => {
    setSelectedImage(image)
  }



  const handleImageResize = (image: PlacedImage, newWidth: number, newHeight: number) => {
    setCanvasLayout(prev => ({
      ...prev,
      images: prev.images.map(img =>
        img.id === image.id
          ? { ...img, width: newWidth, height: newHeight }
          : img
      )
    }))
  }

  const handleRemoveImage = (image: PlacedImage) => {
    setCanvasLayout(prev => ({
      ...prev,
      images: prev.images.filter(img => img.id !== image.id)
    }))

    toast({
      title: "Success",
      description: "Image removed from canvas"
    })
  }

  const handleEditImage = (image: PlacedImage) => {
    setSelectedImage(image)
    setShowEditDialog(true)
  }

  const handleUpdateImage = (updatedImage: PlacedImage) => {
    setCanvasLayout(prev => ({
      ...prev,
      images: prev.images.map(img =>
        img.id === updatedImage.id
          ? { ...img, ...updatedImage }
          : img
      )
    }))

    setShowEditDialog(false)
    setSelectedImage(null)

    toast({
      title: "Success",
      description: `Image updated: ${Math.round(updatedImage.width)}×${Math.round(updatedImage.height)} at position (${Math.round(updatedImage.x)}, ${Math.round(updatedImage.y)})`
    })
  }

  // Test if a Cloudinary URL is accessible
  const testImageUrl = async (url: string) => {
    try {
      const response = await fetch(url, { method: 'HEAD' })
      return response.ok
    } catch (error) {
      console.error('Image URL test failed:', error)
      return false
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/admin/media-grid/layout", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...canvasLayout,
          lastSaved: new Date().toISOString()
        })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Canvas layout saved successfully"
        })
        setCanvasLayout(prev => ({ ...prev, lastSaved: new Date().toISOString() }))
      } else {
        toast({
          title: "Error",
          description: "Failed to save canvas layout",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Save error:", error)
      toast({
        title: "Error",
        description: "Failed to save canvas layout",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteMedia = async (mediaId: string) => {
    if (!confirm("Are you sure you want to delete this media item?")) return

    try {
      const response = await fetch(`/api/admin/media/${mediaId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Media item deleted successfully"
        })
        setMediaItems(prev => prev.filter(item => item._id !== mediaId))

        // Remove from canvas images
        setCanvasLayout(prev => ({
          ...prev,
          images: prev.images.filter(img => img.mediaId !== mediaId)
        }))
      } else {
        toast({
          title: "Error",
          description: "Failed to delete media item",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Delete error:", error)
      toast({
        title: "Error",
        description: "Failed to delete media item",
        variant: "destructive"
      })
    }
  }

  const updateCanvasSize = () => {
    setCanvasLayout(prev => ({
      ...prev,
      canvasWidth: canvasSettings.width,
      canvasHeight: canvasSettings.height
    }))
    toast({
      title: "Success",
      description: "Canvas size updated successfully"
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
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
        <h1 className="text-3xl font-bold text-gray-900">Media Grid Management</h1>
        <p className="text-gray-600">Upload media and create responsive grid layouts</p>
      </div>

      {/* Grid Editor Section */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Media Items */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Media Items</CardTitle>
                  <Button onClick={() => setShowUploadDialog(true)} size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </div>
                <p className="text-sm text-gray-500">{mediaItems.length} items</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mediaItems.map((item, index) => (
                    <div
                      key={item._id || `media-${index}`}
                      className={`p-3 border rounded-lg cursor-grab active:cursor-grabbing transition-colors ${selectedMedia?._id === item._id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      onClick={() => setSelectedMedia(item)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                          {item.cloudinarySecureUrl ? (
                            <img
                              src={item.cloudinarySecureUrl}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="h-6 w-6 text-gray-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{item.name}</h4>
                          <p className="text-xs text-gray-500">{item.type.split('/')[1]} • {formatFileSize(item.size)}</p>
                          <p className="text-xs text-gray-500">
                            {item.createdAt ? formatDate(item.createdAt) : 'Recently'}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">{item.type.split('/')[1]}</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteMedia(item._id || '')
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {mediaItems.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <ImageIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>No media items yet</p>
                      <p className="text-sm">Upload your first image to get started</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Grid Canvas */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Canvas Editor ({canvasLayout.canvasWidth}×{canvasLayout.canvasHeight}px)</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button onClick={handleSave} disabled={saving}>
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <p>
                    💡 <strong>Tip:</strong> Click on a media item to select it, then click anywhere on the canvas to place it. Drag images to move them, resize handles to change size.
                  </p>
                  <div className="text-right">
                    <p>Placed: {canvasLayout.images.length} images</p>
                    <p>Canvas Size: {canvasLayout.canvasWidth}×{canvasLayout.canvasHeight}px</p>
                  </div>
                </div>

              </CardHeader>
              <CardContent>
                {selectedMedia && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">
                          Selected: {selectedMedia.name}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedMedia(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-blue-700 mt-1">
                      Click on a grid cell to place this media item
                    </p>
                  </div>
                )}

                {/* Canvas Area */}
                <div
                  data-canvas
                  className="relative border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 overflow-hidden"
                  style={{
                    width: `${canvasLayout.canvasWidth}px`,
                    height: `${canvasLayout.canvasHeight}px`,
                    maxWidth: '100%',
                    maxHeight: '600px'
                  }}
                  onMouseDown={(e) => {
                    // Only handle canvas clicks when not moving an image
                    if (!isMovingImage && selectedMedia) {
                      const rect = e.currentTarget.getBoundingClientRect()
                      const x = e.clientX - rect.left
                      const y = e.clientY - rect.top

                      const newImage: PlacedImage = {
                        id: `img-${Date.now()}`,
                        mediaId: selectedMedia._id || '',
                        media: selectedMedia,
                        x,
                        y,
                        width: 200, // Default size
                        height: 200,
                        zIndex: canvasLayout.images.length
                      }

                      setCanvasLayout(prev => ({
                        ...prev,
                        images: [...prev.images, newImage]
                      }))

                      setSelectedMedia(null)
                      toast({
                        title: "Success",
                        description: `Added ${selectedMedia.name} to canvas at position (${Math.round(x)}, ${Math.round(y)})`
                      })
                    }
                  }}
                >
                  {/* Canvas Background Grid */}
                  <div className="absolute inset-0 opacity-20">
                    <div className="w-full h-full" style={{
                      backgroundImage: `
                        linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                        linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                      `,
                      backgroundSize: '20px 20px'
                    }} />
                  </div>

                  {/* Placed Images */}
                  {canvasLayout.images.map((image) => (
                    <div
                      key={image.id}
                      className="absolute cursor-move group"
                      style={{
                        left: `${image.x}px`,
                        top: `${image.y}px`,
                        width: `${image.width}px`,
                        height: `${image.height}px`,
                        zIndex: image.zIndex
                      }}
                      onMouseDown={(e) => {
                        if (e.button === 0) { // Left click only
                          e.stopPropagation()
                          e.preventDefault()
                          console.log('Image mousedown: Starting move for', image.media.name)
                          setSelectedImage(image)
                          // Calculate offset from mouse to image position
                          const rect = e.currentTarget.getBoundingClientRect()
                          const offsetX = e.clientX - rect.left
                          const offsetY = e.clientY - rect.top
                          console.log('Move offset:', { offsetX, offsetY })
                          setMoveOffset({
                            x: offsetX,
                            y: offsetY
                          })
                          setIsMovingImage(true)
                        }
                      }}
                    >
                      {/* Image */}
                      <img
                        src={image.media.cloudinarySecureUrl || ''}
                        alt={image.media.name}
                        className="w-full h-full object-cover rounded shadow-lg"
                        draggable={false}
                      />

                      {/* Selection Border */}
                      {selectedImage?.id === image.id && (
                        <div className="absolute inset-0 border-2 border-blue-500 rounded pointer-events-none" />
                      )}

                      {/* Moving Overlay */}
                      {isMovingImage && selectedImage?.id === image.id && (
                        <div className="absolute inset-0 bg-blue-500 bg-opacity-20 rounded pointer-events-none" />
                      )}

                      {/* Resize Handles */}
                      {selectedImage?.id === image.id && (
                        <>
                          {/* Top-left resize handle */}
                          <div
                            className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full cursor-nw-resize z-10"
                            onMouseDown={(e) => {
                              e.stopPropagation()
                              const startX = e.clientX
                              const startY = e.clientY
                              const startWidth = image.width
                              const startHeight = image.height
                              const startImageX = image.x
                              const startImageY = image.y

                              const handleMouseMove = (moveEvent: MouseEvent) => {
                                const deltaX = moveEvent.clientX - startX
                                const deltaY = moveEvent.clientY - startY

                                const newWidth = Math.max(50, startWidth - deltaX)
                                const newHeight = Math.max(50, startHeight - deltaY)
                                const newX = startImageX + (startWidth - newWidth)
                                const newY = startImageY + (startHeight - newHeight)

                                setCanvasLayout(prev => ({
                                  ...prev,
                                  images: prev.images.map(img =>
                                    img.id === image.id
                                      ? { ...img, width: newWidth, height: newHeight, x: newX, y: newY }
                                      : img
                                  )
                                }))
                              }

                              const handleMouseUp = () => {
                                document.removeEventListener('mousemove', handleMouseMove)
                                document.removeEventListener('mouseup', handleMouseUp)
                              }

                              document.addEventListener('mousemove', handleMouseMove)
                              document.addEventListener('mouseup', handleMouseUp)
                            }}
                          />
                          {/* Top-right resize handle */}
                          <div
                            className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-ne-resize z-10"
                            onMouseDown={(e) => {
                              e.stopPropagation()
                              const startX = e.clientX
                              const startY = e.clientY
                              const startWidth = image.width
                              const startHeight = image.height
                              const startImageY = image.y

                              const handleMouseMove = (moveEvent: MouseEvent) => {
                                const deltaX = moveEvent.clientX - startX
                                const deltaY = moveEvent.clientY - startY

                                const newWidth = Math.max(50, startWidth + deltaX)
                                const newHeight = Math.max(50, startHeight - deltaY)
                                const newY = startImageY + (startHeight - newHeight)

                                setCanvasLayout(prev => ({
                                  ...prev,
                                  images: prev.images.map(img =>
                                    img.id === image.id
                                      ? { ...img, width: newWidth, height: newHeight, y: newY }
                                      : img
                                  )
                                }))
                              }

                              const handleMouseUp = () => {
                                document.removeEventListener('mousemove', handleMouseMove)
                                document.removeEventListener('mouseup', handleMouseUp)
                              }

                              document.addEventListener('mousemove', handleMouseMove)
                              document.addEventListener('mouseup', handleMouseUp)
                            }}
                          />
                          {/* Bottom-left resize handle */}
                          <div
                            className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-full cursor-sw-resize z-10"
                            onMouseDown={(e) => {
                              e.stopPropagation()
                              const startX = e.clientX
                              const startY = e.clientY
                              const startWidth = image.width
                              const startHeight = image.height
                              const startImageX = image.x

                              const handleMouseMove = (moveEvent: MouseEvent) => {
                                const deltaX = moveEvent.clientX - startX
                                const deltaY = moveEvent.clientY - startY

                                const newWidth = Math.max(50, startWidth - deltaX)
                                const newHeight = Math.max(50, startHeight + deltaY)
                                const newX = startImageX + (startWidth - newWidth)

                                setCanvasLayout(prev => ({
                                  ...prev,
                                  images: prev.images.map(img =>
                                    img.id === image.id
                                      ? { ...img, width: newWidth, height: newHeight, x: newX }
                                      : img
                                  )
                                }))
                              }

                              const handleMouseUp = () => {
                                document.removeEventListener('mousemove', handleMouseMove)
                                document.removeEventListener('mouseup', handleMouseUp)
                              }

                              document.addEventListener('mousemove', handleMouseMove)
                              document.addEventListener('mouseup', handleMouseUp)
                            }}
                          />
                          {/* Bottom-right resize handle */}
                          <div
                            className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-se-resize z-10"
                            onMouseDown={(e) => {
                              e.stopPropagation()
                              const startX = e.clientX
                              const startY = e.clientY
                              const startWidth = image.width
                              const startHeight = image.height

                              const handleMouseMove = (moveEvent: MouseEvent) => {
                                const deltaX = moveEvent.clientX - startX
                                const deltaY = moveEvent.clientY - startY

                                const newWidth = Math.max(50, startWidth + deltaX)
                                const newHeight = Math.max(50, startHeight + deltaY)

                                setCanvasLayout(prev => ({
                                  ...prev,
                                  images: prev.images.map(img =>
                                    img.id === image.id
                                      ? { ...img, width: newWidth, height: newHeight }
                                      : img
                                  )
                                }))
                              }

                              const handleMouseUp = () => {
                                document.removeEventListener('mousemove', handleMouseMove)
                                document.removeEventListener('mouseup', handleMouseUp)
                              }

                              document.addEventListener('mousemove', handleMouseMove)
                              document.addEventListener('mouseup', handleMouseUp)
                            }}
                          />
                        </>
                      )}

                      {/* Image Controls */}
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 bg-white/90 hover:bg-white text-gray-700"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditImage(image)
                            }}
                            title="Edit image properties"
                          >
                            <Settings className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 bg-red-500/90 hover:bg-red-500 text-white"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemoveImage(image)
                            }}
                            title="Remove image"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Image Info */}
                      <div className="absolute bottom-1 left-1 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                        {Math.round(image.width)}×{Math.round(image.height)}
                      </div>
                    </div>
                  ))}

                  {/* Canvas Click Instructions */}
                  {selectedMedia && !isMovingImage && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
                        <p className="text-sm font-medium">
                          Click anywhere to place "{selectedMedia.name}"
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Moving Instructions */}
                  {isMovingImage && selectedImage && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
                        <p className="text-sm font-medium">
                          Moving "{selectedImage.media.name}" - Release to drop
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Canvas Controls */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Canvas Controls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="canvasWidth">Canvas Width (px)</Label>
                      <Input
                        id="canvasWidth"
                        type="number"
                        min="400"
                        max="2000"
                        step="50"
                        value={canvasSettings.width}
                        onChange={(e) => setCanvasSettings(prev => ({ ...prev, width: parseInt(e.target.value) || 1200 }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="canvasHeight">Canvas Height (px)</Label>
                      <Input
                        id="canvasHeight"
                        type="number"
                        min="300"
                        max="1500"
                        step="50"
                        value={canvasSettings.height}
                        onChange={(e) => setCanvasSettings(prev => ({ ...prev, height: parseInt(e.target.value) || 800 }))}
                      />
                    </div>
                  </div>

                  <Button onClick={updateCanvasSize} variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Update Canvas Size
                  </Button>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="published">Published</Label>
                      <p className="text-sm text-gray-500">Make canvas visible to users</p>
                    </div>
                    <Switch
                      id="published"
                      checked={canvasLayout.isPublished}
                      onCheckedChange={(checked) => setCanvasLayout(prev => ({ ...prev, isPublished: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="live">Live</Label>
                      <p className="text-sm text-gray-500">Enable live updates</p>
                    </div>
                    <Switch
                      id="live"
                      checked={canvasLayout.isLive}
                      onCheckedChange={(checked) => setCanvasLayout(prev => ({ ...prev, isLive: checked }))}
                    />
                  </div>
                  <div className="text-sm text-gray-500">
                    {mediaItems.length} items • Last saved: {formatDate(canvasLayout.lastSaved)}
                  </div>
                  <p className="text-xs text-gray-400">
                    Tip: Click a media item to select it, then click anywhere on the canvas to place it. Drag images to move them.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Media</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="uploadFile">File</Label>
              <Input
                id="uploadFile"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                ref={fileInputRef}
              />
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: JPEG, PNG, GIF, WebP (max 10MB)
              </p>
            </div>
            <div>
              <Label htmlFor="uploadName">Name</Label>
              <Input
                id="uploadName"
                value={uploadForm.name}
                onChange={(e) => setUploadForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter media name"
              />
            </div>
            <div>
              <Label htmlFor="uploadDescription">Description</Label>
              <Textarea
                id="uploadDescription"
                value={uploadForm.description}
                onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter media description"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={uploading}>
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Image Properties</DialogTitle>
            <DialogDescription>
              Customize how this image appears on the canvas
            </DialogDescription>
          </DialogHeader>
          {selectedImage && selectedImage.media && (
            <div className="space-y-4">
              {/* Media Preview */}
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-2 rounded overflow-hidden">
                  {selectedImage.media.cloudinarySecureUrl ? (
                    <img
                      src={selectedImage.media.cloudinarySecureUrl}
                      alt={selectedImage.media.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <p className="text-sm font-medium">{selectedImage.media.name}</p>
                <p className="text-xs text-gray-500">Position: ({Math.round(selectedImage.x)}, {Math.round(selectedImage.y)})</p>
              </div>

              {/* Image Properties */}
              <div className="space-y-3">
                <div>
                  <Label htmlFor="imageWidth">Width (px)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="imageWidth"
                      type="number"
                      min="50"
                      max="1000"
                      step="10"
                      value={Math.round(selectedImage.width)}
                      onChange={(e) => {
                        const newWidth = parseInt(e.target.value) || 200
                        handleImageResize(selectedImage, newWidth, selectedImage.height)
                      }}
                    />
                    <span className="text-xs text-gray-500">
                      Current: {Math.round(selectedImage.width)}px
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Image width in pixels
                  </p>
                </div>

                <div>
                  <Label htmlFor="imageHeight">Height (px)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="imageHeight"
                      type="number"
                      min="50"
                      max="1000"
                      step="10"
                      value={Math.round(selectedImage.height)}
                      onChange={(e) => {
                        const newHeight = parseInt(e.target.value) || 200
                        handleImageResize(selectedImage, selectedImage.width, newHeight)
                      }}
                    />
                    <span className="text-xs text-gray-500">
                      Current: {Math.round(selectedImage.height)}px
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Image height in pixels
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => selectedImage && handleUpdateImage(selectedImage)}>
                  Update Image
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
