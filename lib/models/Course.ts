import type { ObjectId } from "mongodb"

export interface Course {
  _id?: ObjectId
  title: string
  description: string
  price: number
  originalPrice?: number
  category: string
  level: "beginner" | "intermediate" | "advanced"
  duration: number // in minutes
  videoUrl?: string
  thumbnailUrl?: string
  lessons: Lesson[]
  enrolledCount: number
  rating: number
  totalRatings: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Lesson {
  _id?: ObjectId
  title: string
  description: string
  videoUrl: string
  duration: number // in minutes
  order: number
  isPreview: boolean
}
