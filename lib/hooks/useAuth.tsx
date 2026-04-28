"use client"

import { useSession, signIn, signOut } from "next-auth/react"
import { useState, useEffect } from "react"
import type { AuthUser } from "@/lib/types"

export function useAuth() {
  const { data: session, status } = useSession()
  const [localUser, setLocalUser] = useState<AuthUser | null>(null)

  // Check for local auth token on mount
  useEffect(() => {
    const checkLocalAuth = async () => {
      // Only check if we don't already have a local user and NextAuth session is not loading
      if (localUser || status === "loading") return

      // Check if we're in the browser
      if (typeof window === 'undefined') return

      try {
        const response = await fetch('/api/auth/profile', {
          credentials: 'include'
        })
        if (response.ok) {
          const contentType = response.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            try {
              const data = await response.json()
              if (data.user) {
                setLocalUser({
                  id: data.user.id,
                  name: data.user.name || "",
                  email: data.user.email || "",
                  role: data.user.role || "student",
                  enrolledCourses: data.user.enrolledCourses || []
                })
              }
            } catch (jsonError) {
              // console.log("Failed to parse JSON response")
            }
          } else {
            // console.log("Response is not JSON, skipping")
          }
        } else if (response.status === 404) {
          // console.log("Profile endpoint not found, skipping")
        }
      } catch (error) {
        // Silently ignore errors - user just isn't logged in
        // console.log("No local auth token found")
      }
    }

    // Only run once when component mounts or when status changes to not loading
    if (status !== "loading" && !localUser) {
      checkLocalAuth()
    }
  }, [status]) // Remove localUser from dependencies to prevent infinite loop

  // Prefer localUser if it has more complete data, otherwise use NextAuth session
  const user: AuthUser | null = localUser || (session?.user ? {
    id: session.user.id || session.user.email || "",
    name: session.user.name || "",
    email: session.user.email || "",
    role: "student",
    enrolledCourses: session.user.enrolledCourses || []
  } : null)

  const loading = status === "loading" && !localUser

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        const data = await response.json()
        // Set local user immediately
        const userData = {
          id: data.user.id,
          name: data.user.name || "",
          email: data.user.email || "",
          role: data.user.role || "student",
          enrolledCourses: data.user.enrolledCourses || []
        }
        setLocalUser(userData)
        return true
      }
      return false
    } catch (error) {
      // console.error("🔍 Login error:", error)
      return false
    }
  }

  const register = async (name: string, email: string, password: string, phone?: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phone }),
      })

      if (response.ok) {
        const data = await response.json()
        // Set local user immediately after registration
        setLocalUser({
          id: data.user.id,
          name: data.user.name || "",
          email: data.user.email || "",
          role: data.user.role || "student",
          enrolledCourses: data.user.enrolledCourses || []
        })
        return true
      }
      return false
    } catch (error) {
      return false
    }
  }

  const logout = async (): Promise<void> => {
    // Clear local user
    setLocalUser(null)
    // Also try NextAuth logout if available
    try {
      await signOut({ redirect: false })
    } catch (error) {
      // console.log("NextAuth logout failed, but local user cleared")
    }

    // Clear auth token cookie
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch (error) {
      // console.log("Logout API call failed")
    }
    
    // Refresh the page after logout to clear any cached data
    setTimeout(() => {
      window.location.reload()
    }, 100)
  }

  const refreshUser = async (): Promise<void> => {
    try {
      const response = await fetch('/api/auth/profile', {
        credentials: 'include',
        cache: 'no-cache', // Force fresh data
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      if (response.ok) {
        const data = await response.json()
        if (data.user) {
          const userData = {
            id: data.user.id,
            name: data.user.name || "",
            email: data.user.email || "",
            role: data.user.role || "student",
            enrolledCourses: data.user.enrolledCourses || []
          }
          setLocalUser(userData)

          // Also trigger a re-render by updating a timestamp
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('userUpdated', { detail: userData }))
          }
        }
      }
    } catch (error) {
      // Silent error handling
    }
  }

  return {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser,
  }
}
