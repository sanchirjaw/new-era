"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Image as ImageIcon, Eye, Calendar } from "lucide-react"

interface MediaItem {
  id: string
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
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  mediaId: string
  media: MediaItem
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

interface PublicMediaGridProps {
  gridLayout: CanvasLayout | null
  loading?: boolean
}

export default function PublicMediaGrid({ gridLayout, loading = false }: PublicMediaGridProps) {
  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-br from-muted/30 to-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading media grid...</p>
          </div>
        </div>
      </section>
    )
  }

  if (!gridLayout || !gridLayout.isPublished) {
    return null
  }

  // Filter images that have media
  const mediaImages = gridLayout.images.filter(image => image.mediaId && image.media)

  if (mediaImages.length === 0) {
    return null
  }

  return (
    <section className="py-20 bg-gradient-to-br from-muted/30 to-muted/20 min-h-[500px]">
      <div className="container mx-auto px-4">
        

        {/* Canvas Display */}
        <div className="w-full flex justify-center">
          <div 
            className="relative bg-card/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 lg:p-8 shadow-lg border border-border/20 overflow-hidden"
            style={{
              width: `${gridLayout.canvasWidth}px`,
              height: `${gridLayout.canvasHeight}px`,
              maxWidth: '100%',
              maxHeight: '600px'
            }}
          >
            {mediaImages.map((image) => (
              <div
                key={image.id}
                className="absolute group cursor-pointer transition-all duration-300 hover:scale-[1.02]"
                style={{
                  left: `${image.x}px`,
                  top: `${image.y}px`,
                  width: `${image.width}px`,
                  height: `${image.height}px`,
                  zIndex: image.zIndex
                }}
              >
                {/* Media Content */}
                <div className="w-full h-full relative rounded-lg overflow-hidden">
                  {image.media.cloudinarySecureUrl ? (
                    <img 
                      src={image.media.cloudinarySecureUrl} 
                      alt={image.media.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-muted/50 via-muted/30 to-muted/50 flex items-center justify-center p-2">
                      <div className="text-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-[#5B7FFF] to-purple-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                          <ImageIcon className="h-4 w-4 text-white" />
                        </div>
                        <h3 className="font-semibold text-card-foreground mb-1 text-xs leading-tight">
                          {image.media.name}
                        </h3>
                        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs bg-background/80">
                            {image.media.type.split('/')[1].toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Size Indicator */}
                <div className="absolute top-1 right-1 bg-blue-500/90 text-white text-xs px-2 py-1 rounded-full">
                  {Math.round(image.width)}×{Math.round(image.height)}
                </div>
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center">
                  <div className="text-center text-white p-2">
                    <div className="bg-card/20 backdrop-blur-sm rounded-full p-2 inline-block mb-2">
                      <Eye className="h-4 w-4 text-white" />
                    </div>
                    <p className="text-xs font-medium">Харах</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Grid Info & CTA */}
        
      </div>
    </section>
  )
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
  return date.toLocaleDateString('mn-MN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
