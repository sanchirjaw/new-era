import type { ObjectId } from "mongodb"

export interface UserProgress {
  _id?: ObjectId
  userId: ObjectId
  courseId: ObjectId
  lessonId: ObjectId
  completedAt: Date
  isCompleted: boolean
  progress: number // percentage (0-100)
  timeSpent: number // in seconds
  createdAt: Date
  updatedAt: Date
}

export interface CourseProgress {
  _id?: ObjectId
  userId: ObjectId
  courseId: ObjectId
  completedLessons: ObjectId[]
  totalLessons: number
  progress: number // percentage (0-100)
  lastAccessedAt: Date
  createdAt: Date
  updatedAt: Date
}
