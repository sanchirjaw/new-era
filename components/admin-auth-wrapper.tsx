"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"

interface AdminAuthWrapperProps {
  children: React.ReactNode
}

export function AdminAuthWrapper({ children }: AdminAuthWrapperProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  // Skip authentication check for login page
  const isLoginPage = pathname === "/admin/login"

  useEffect(() => {
    // If it's the login page, don't check authentication
    if (isLoginPage) {
      setLoading(false)
      return
    }

    const checkAuth = async () => {
      try {
        // Add a small delay to ensure cookie is set after login
        if (pathname === "/admin") {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
        
        // Check if admin token exists and is valid
        const response = await fetch("/api/admin/check")
        console.log("Admin check response:", response.status, response.ok)
        
        if (response.ok) {
          setIsAuthenticated(true)
          setLoading(false)
        } else {
          console.log("Admin check failed, redirecting to login")
          router.push("/admin/login")
        }
      } catch (error) {
        console.error("Admin check error:", error)
        router.push("/admin/login")
      }
    }

    // Check auth immediately
    checkAuth()
  }, [router, isLoginPage, pathname])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Шалгаж байна...</p>
        </div>
      </div>
    )
  }

  // If it's the login page, render without authentication check
  if (isLoginPage) {
    return <>{children}</>
  }

  // For other admin pages, require authentication
  if (!isAuthenticated) {
    return null // Will redirect to login
  }

  return <>{children}</>
}
