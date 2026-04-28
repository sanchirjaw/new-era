"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/hooks/useAuth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { User, LogOut, BookOpen, Home, GraduationCap } from "lucide-react"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"

export function Header() {
  const { user, logout } = useAuth()
  const pathname = usePathname()

  return (
    <header className="border-b bg-background relative z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Logo className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold">New Era</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className={`text-muted-foreground hover:text-primary border-b-2 pb-1 transition-colors ${
                pathname === "/" 
                  ? "border-primary text-primary" 
                  : "border-transparent"
              }`}
            >
              Нүүр
            </Link>
            <Link 
              href="/courses" 
              className={`text-muted-foreground hover:text-primary border-b-2 pb-1 transition-colors ${
                pathname === "/courses" 
                  ? "border-primary text-primary" 
                  : "border-transparent"
              }`}
            >
              Хичээлүүд
            </Link>
          </nav>

          <div className="flex items-center space-x-4 relative">
            <ThemeToggle />
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user.name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 z-[9999]" align="end" forceMount sideOffset={8}>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user.name}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  
                  {/* Navigation Links - Visible on mobile through dropdown */}
                  <div className="md:hidden">
                    <DropdownMenuItem asChild>
                      <Link href="/" className="cursor-pointer">
                        <Home className="mr-2 h-4 w-4" />
                        Нүүр
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/courses" className="cursor-pointer">
                        <GraduationCap className="mr-2 h-4 w-4" />
                        Хичээлүүд
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </div>
                  
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Миний хичээлүүд
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Профайл
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Гарах
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild className="bg-primary hover:bg-primary/90">
                <Link href="/login">Нэвтрэх</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
