import type { ObjectId } from "mongodb"

export interface User {
  _id?: ObjectId
  name: string
  email: string
  password?: string // Optional for OAuth users
  role: "student" | "admin"
  enrolledCourses: ObjectId[]
  googleId?: string
  oauthProvider?: "google" // OAuth provider
  oauthId?: string // OAuth user ID
  profilePicture?: string
  phone?: string
  address?: string
  bio?: string
  resetToken?: string
  resetTokenExpiry?: Date
  createdAt: Date
  updatedAt: Date
}

export interface UserSession {
  _id?: ObjectId
  userId: ObjectId
  token: string
  expiresAt: Date
  createdAt: Date
}
