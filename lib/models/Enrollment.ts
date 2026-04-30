import type { ObjectId } from "mongodb"

export interface Enrollment {
  _id?: ObjectId
  userId: ObjectId
  courseId: ObjectId
  paymentId: ObjectId
  enrolledAt: Date
  expiresAt?: Date | null  // null or undefined = lifetime access
  completedLessons: ObjectId[]
  progress: number // percentage
  isActive: boolean
}
