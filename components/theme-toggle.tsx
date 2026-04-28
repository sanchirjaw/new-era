"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Moon, Sun } from "lucide-react"

export function ThemeToggle() {
  const [dark, setDark] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    // Set mounted to true after hydration
    setMounted(true)
    
    // Get initial theme from localStorage
    const savedTheme = localStorage.getItem("theme")
    const isDark = savedTheme === "dark"
    setDark(isDark)
    
    // Apply theme to document
    const root = document.documentElement
    if (isDark) {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
  }, [])
  
  useEffect(() => {
    if (!mounted) return
    
    const root = document.documentElement
    if (dark) { 
      root.classList.add("dark")
      localStorage.setItem("theme", "dark")
    } else { 
      root.classList.remove("dark")
      localStorage.setItem("theme", "light")
    }
  }, [dark, mounted])
  
  const toggleTheme = () => {
    setDark(prev => !prev)
  }
  
  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" aria-label="Toggle dark mode" disabled>
        <Sun className="h-4 w-4" />
      </Button>
    )
  }
  
  return (
    <Button variant="ghost" size="sm" onClick={toggleTheme} aria-label="Toggle dark mode">
      {dark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </Button>
  )
}
