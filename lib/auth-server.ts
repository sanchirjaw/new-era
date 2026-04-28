import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { db } from "./database"
import type { AuthUser } from "./types"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword)
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "7d" })
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser
  } catch {
    return null
  }
}

export async function createUser(name: string, email: string, password: string, phone?: string): Promise<AuthUser> {
  const existingUser = await db.getUserByEmail(email)
  if (existingUser) {
    throw new Error("User already exists")
  }

  const hashedPassword = await hashPassword(password)
  const userId = await db.createUser({
    name,
    email,
    password: hashedPassword,
    role: "student",
    enrolledCourses: [],
    phone,
  })

  return {
    id: userId.toString(),
    email,
    name,
    role: "student",
  }
}

export async function createAdminUser(name: string, email: string, password: string): Promise<AuthUser> {
  const existingUser = await db.getUserByEmail(email)
  if (existingUser) {
    throw new Error("User already exists")
  }

  const hashedPassword = await hashPassword(password)
  const userId = await db.createUser({
    name,
    email,
    password: hashedPassword,
    role: "admin",
    enrolledCourses: [],
  })

  return {
    id: userId.toString(),
    email,
    name,
    role: "admin",
  }
}

export async function authenticateUser(email: string, password: string): Promise<AuthUser | null> {
  const user = await db.getUserByEmail(email)
  if (!user) {
    return null
  }

  const isValid = await verifyPassword(password, user.password)
  if (!isValid) {
    return null
  }

  return {
    id: user._id!.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
  }
}
