import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { db } from "./database"
import type { AuthUser } from "./types"
import type { NextRequest } from "next/server"

/**
 * Checks both admin-token cookie AND NextAuth session.
 * Returns an admin user object or null.
 * Always checks both — no if/else skipping.
 */
export async function getAdminUser(request: NextRequest): Promise<AuthUser | null> {
  // 1. Try admin-token cookie first (fast path)
  const token = request.cookies.get("admin-token")?.value
  if (token) {
    const tokenUser = verifyToken(token)
    if (tokenUser && tokenUser.role === "admin") return tokenUser
  }

  // 2. Try NextAuth session
  try {
    const { auth } = await import("@/auth")
    const session = await auth()
    if (session?.user?.email) {
      const dbUser = await db.getUserByEmail(session.user.email)
      if (dbUser && dbUser.role === "admin") {
        return { id: dbUser._id!.toString(), email: dbUser.email, name: dbUser.name, role: "admin" }
      }
    }
  } catch {}

  return null
}

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
  // Check duplicate by email (if provided)
  if (email) {
    const existingByEmail = await db.getUserByEmail(email)
    if (existingByEmail) throw new Error("User already exists")
  }

  // Check duplicate by phone (if provided and no email)
  if (!email && phone) {
    const existingByPhone = await db.getUserByPhone(phone)
    if (existingByPhone) throw new Error("User already exists")
  }

  const hashedPassword = await hashPassword(password)
  const userId = await db.createUser({
    name,
    email: email || "",
    password: hashedPassword,
    role: "student",
    enrolledCourses: [],
    phone,
  })

  return {
    id: userId.toString(),
    email: email || "",
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

export async function authenticateUser(emailOrPhone: string, password: string): Promise<AuthUser | null> {
  // Try email first, then phone number
  let user = await db.getUserByEmail(emailOrPhone)
  if (!user) {
    user = await db.getUserByPhone(emailOrPhone)
  }
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
