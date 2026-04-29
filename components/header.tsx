"use client"

import { useState } from "react"
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
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  User, LogOut, BookOpen, Home, GraduationCap,
  Menu, X, ShoppingBag, Bell, HelpCircle, ChevronRight
} from "lucide-react"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"

const GRAD = "linear-gradient(135deg, #00E5A0 0%, #7B61FF 100%)"

function GradientText({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`bg-clip-text text-transparent ${className}`} style={{ backgroundImage: GRAD }}>
      {children}
    </span>
  )
}

/* ─── Mobile Profile Drawer ───────────────────────────── */
function ProfileDrawer({ user, logout }: { user: any; logout: () => void }) {
  const [open, setOpen] = useState(false)

  const joinYear = user?.createdAt
    ? new Date(user.createdAt).getFullYear()
    : new Date().getFullYear()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="relative h-10 w-10 rounded-full overflow-hidden flex-shrink-0">
          <div className="w-full h-full flex items-center justify-center text-white font-bold text-base"
            style={{ background: GRAD }}>
            {user.name?.charAt(0).toUpperCase() || "U"}
          </div>
        </button>
      </SheetTrigger>

      <SheetContent side="left" className="w-[300px] p-0 flex flex-col" style={{ background: "var(--background)" }}>

        {/* ── Header ── */}
        <div className="px-5 pt-8 pb-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-black text-xl flex-shrink-0"
              style={{ background: GRAD }}>
              {user.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-base text-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground">Гишүүн</p>
              <p className="text-xs text-muted-foreground">нэгдсэн {joinYear}</p>
            </div>
          </div>
        </div>

        {/* ── Nav ── */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">

          {/* АКАДЕМИ */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-2 mb-2">
              Академи
            </p>
            <nav className="space-y-1">
              {[
                { href: "/courses", icon: <GraduationCap className="w-4 h-4" />, label: "Сургалтууд" },
                { href: "/dashboard", icon: <BookOpen className="w-4 h-4" />, label: "Миний сургалтууд" },
                { href: "/dashboard?tab=history", icon: <ShoppingBag className="w-4 h-4" />, label: "Худалдан авалтын түүх" },
              ].map(item => (
                <Link key={item.href} href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors group">
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground group-hover:text-foreground">{item.icon}</span>
                    {item.label}
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
                </Link>
              ))}
            </nav>
          </div>

          {/* БҮРТГЭЛ */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-2 mb-2">
              Бүртгэл
            </p>
            <nav className="space-y-1">
              {[
                { href: "/profile", icon: <User className="w-4 h-4" />, label: "Профайл" },
                { href: "/notifications", icon: <Bell className="w-4 h-4" />, label: "Мэдэгдлүүд" },
                { href: "/help", icon: <HelpCircle className="w-4 h-4" />, label: "Тусламж" },
              ].map(item => (
                <Link key={item.href} href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors group">
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground group-hover:text-foreground">{item.icon}</span>
                    {item.label}
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* ── Logout ── */}
        <div className="px-4 pb-6 pt-3 border-t border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm flex-shrink-0"
              style={{ background: GRAD }}>
              N
            </div>
            <span className="text-sm font-semibold text-foreground">New Era</span>
          </div>
          <button
            onClick={() => { logout(); setOpen(false) }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90"
            style={{ background: "#EF4444" }}>
            <LogOut className="w-4 h-4" />
            Гарах
          </button>
        </div>

      </SheetContent>
    </Sheet>
  )
}

/* ─── Header ──────────────────────────────────────────── */
export function Header() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="border-b bg-background relative z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2" onClick={() => setMobileOpen(false)}>
            <span className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-lg"
              style={{ background: GRAD }}>N</span>
            <span className="text-xl font-black tracking-tight">
              New<GradientText>Era</GradientText>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/"
              className={`font-bold text-lg pb-1 border-b-2 transition-colors ${pathname === "/" ? "border-transparent" : "border-transparent text-foreground/70 hover:text-foreground"}`}>
              {pathname === "/" ? <GradientText>Нүүр</GradientText> : "Нүүр"}
            </Link>
            <Link href="/courses"
              className={`font-bold text-lg pb-1 border-b-2 transition-colors ${pathname === "/courses" ? "border-transparent" : "border-transparent text-foreground/70 hover:text-foreground"}`}>
              {pathname === "/courses" ? <GradientText>Хичээлүүд</GradientText> : "Хичээлүүд"}
            </Link>
          </nav>

          {/* Right */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />

            {user ? (
              <>
                {/* Mobile: slide-out drawer */}
                <div className="md:hidden">
                  <ProfileDrawer user={user} logout={logout} />
                </div>

                {/* Desktop: dropdown */}
                <div className="hidden md:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="text-white font-bold" style={{ background: GRAD }}>
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
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard" className="cursor-pointer">
                          <BookOpen className="mr-2 h-4 w-4" />Миний хичээлүүд
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/profile" className="cursor-pointer">
                          <User className="mr-2 h-4 w-4" />Профайл
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={logout} className="cursor-pointer">
                        <LogOut className="mr-2 h-4 w-4" />Гарах
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            ) : (
              <>
                <a href="/login" className="ne-btn-primary text-sm px-5 py-2 hidden sm:inline-flex">
                  Нэвтрэх
                </a>
                <button
                  className="sm:hidden p-2 rounded-lg text-foreground hover:bg-muted transition-colors"
                  onClick={() => setMobileOpen(!mobileOpen)}
                  aria-label="Menu">
                  {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu for non-logged-in */}
      {mobileOpen && !user && (
        <div className="sm:hidden border-t bg-background px-4 py-4 space-y-2 animate-authIn">
          <Link href="/" onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-3 py-3 rounded-xl font-semibold text-sm text-foreground/80 hover:text-foreground hover:bg-muted transition-colors">
            <Home className="w-5 h-5" />Нүүр
          </Link>
          <Link href="/courses" onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-3 py-3 rounded-xl font-semibold text-sm text-foreground/80 hover:text-foreground hover:bg-muted transition-colors">
            <GraduationCap className="w-5 h-5" />Хичээлүүд
          </Link>
          <div className="pt-1 border-t">
            <a href="/login" className="ne-btn-primary w-full text-center text-sm py-3 block mt-2">
              Нэвтрэх
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
