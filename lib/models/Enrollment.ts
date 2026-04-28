import type { ObjectId } from "mongodb"

export interface Enrollment {
  _id?: ObjectId
  userId: ObjectId
  courseId: ObjectId
  paymentId: ObjectId
  enrolledAt: Date
  completedLessons: ObjectId[]
  progress: number // percentage
  isActive: boolean
}
