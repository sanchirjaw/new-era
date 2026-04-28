"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, BookOpen, Users, CreditCard, ImageIcon, Database, Settings, LogOut } from "lucide-react"

const sidebarItems = [
  {
    title: "Хянаалтын самбар",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Хичээлүүд",
    href: "/admin/courses",
    icon: BookOpen,
  },
  {
    title: "Хэрэглэгчид",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Төлбөрүүд",
    href: "/admin/payments",
    icon: CreditCard,
  },
  {
    title: "Медиа сан",
    href: "/admin/media-grid",
    icon: ImageIcon,
  },
  {
    title: "Өгөгдлийн сан",
    href: "/admin/database",
    icon: Database,
  },
  {
    title: "Тохиргоо",
    href: "/admin/settings",
    icon: Settings,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()

  const handleLogout = async () => {
    try {
            // Use the admin logout API to properly clear the token
      await fetch("/api/admin/logout", { method: "POST" })
      window.location.href = "/admin/login"
    } catch (error) {
      // Fallback: clear cookie manually and redirect
      document.cookie = "admin-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
      window.location.href = "/admin/login"
    }
  }

  return (
    <div className="flex h-full w-64 flex-col bg-gray-50 border-r border-gray-200">
      {/* Sidebar Navigation */}
      <nav className="flex-1 space-y-1 px-4 py-6">
        {sidebarItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors",
                isActive
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm",
              )}
            >
              <Icon
                className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0",
                  isActive ? "text-gray-700" : "text-gray-500 group-hover:text-gray-700",
                )}
              />
              {item.title}
            </Link>
          )
        })}
      </nav>

      {/* Admin User Info */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-[#5B7FFF] flex items-center justify-center">
              <span className="text-sm font-medium text-white">A</span>
            </div>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900">Admin</p>
            <p className="text-xs text-gray-500">admin@bypass.local</p>
          </div>
          <button onClick={handleLogout} className="ml-3 flex-shrink-0 text-gray-400 hover:text-gray-600" title="Гарах">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
