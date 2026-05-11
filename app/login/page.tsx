"use client"

import type React from "react"
import { Suspense } from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/hooks/useAuth"
import { Header } from "@/components/header"
import { GoogleButton } from "@/components/ui/google-button"
import { FacebookButton } from "@/components/ui/facebook-button"
import { signIn } from "next-auth/react"

function AuthForm() {
  const [tab, setTab] = useState<"login" | "register">("login")

  // Login state
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState("")

  // Register state
  const [regName, setRegName] = useState("")
  const [regEmail, setRegEmail] = useState("")
  const [regPhone, setRegPhone] = useState("")
  const [regPassword, setRegPassword] = useState("")
  const [regLoading, setRegLoading] = useState(false)
  const [regError, setRegError] = useState("")

  const { login, register } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Switch to register tab if ?tab=register
    if (searchParams.get("tab") === "register") setTab("register")

    const oauthError = searchParams.get("error")
    if (oauthError) {
      const msg =
        oauthError === "oauth_not_configured" ? "Google нэвтрэлт тохиргоогүй байна." :
        oauthError === "google_auth_failed"   ? "Google баталгаажуулалт амжилтгүй." :
        "Баталгаажуулалт амжилтгүй. Дахин оролдоно уу."
      setLoginError(msg)
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError("")
    const success = await login(loginEmail, loginPassword)
    if (success) {
      setTimeout(() => router.push("/"), 100)
    } else {
      setLoginError("Имэйл эсвэл нууц үг буруу байна")
    }
    setLoginLoading(false)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegLoading(true)
    setRegError("")
    if (!regEmail && !regPhone) {
      setRegError("Имэйл эсвэл утасны дугаарын аль нэгийг оруулна уу")
      setRegLoading(false)
      return
    }
    if (regPhone && !/^\+?[0-9\s-]{7,15}$/.test(regPhone)) {
      setRegError("Утасны дугаарын формат буруу байна. Жишээ: 99112233")
      setRegLoading(false)
      return
    }
    const success = await register(regName, regEmail, regPassword, regPhone)
    if (success) {
      router.push("/")
    } else {
      setRegError("Бүртгэл үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.")
    }
    setRegLoading(false)
  }

  const handleGoogle = async () => {
    setLoginError(""); setRegError("")
    try { await signIn("google", { callbackUrl: "/", redirect: true }) }
    catch { setLoginError("Google баталгаажуулалт амжилтгүй.") }
  }

  const handleFacebook = async () => {
    setLoginError(""); setRegError("")
    try { await signIn("facebook", { callbackUrl: "/", redirect: true }) }
    catch { setLoginError("Facebook баталгаажуулалт амжилтгүй.") }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex items-center justify-center py-10 px-4">
        <div className="w-full max-w-md">

          {/* Tab switcher */}
          <div className="flex rounded-xl border overflow-hidden mb-6">
            <button
              onClick={() => setTab("login")}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${tab === "login" ? "bg-primary text-white" : "bg-background text-muted-foreground hover:bg-muted"}`}
            >
              Нэвтрэх
            </button>
            <button
              onClick={() => setTab("register")}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${tab === "register" ? "bg-primary text-white" : "bg-background text-muted-foreground hover:bg-muted"}`}
            >
              Бүртгүүлэх
            </button>
          </div>

          {/* Login form */}
          {tab === "login" && (
            <form
              className="space-y-5 rounded-2xl border p-6 md:p-8 bg-background/60 backdrop-blur shadow-soft"
              onSubmit={handleLogin}
            >
              <div>
                <Label htmlFor="login-email">Имэйл эсвэл утасны дугаар</Label>
                <Input id="login-email" type="text" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required className="mt-1" autoComplete="email" placeholder="example@mail.com эсвэл 99112233" />
              </div>
              <div>
                <Label htmlFor="login-password">Нууц үг</Label>
                <PasswordInput id="login-password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required className="mt-1" autoComplete="current-password" />
              </div>
              <div className="text-right">
                <Link href="/reset-password" className="text-sm text-primary hover:text-primary/80 transition-colors">
                  Нууц үгээ мартсан уу?
                </Link>
              </div>
              {loginError && <p className="text-red-600 text-sm text-center">{loginError}</p>}
              <Button type="submit" className="w-full" disabled={loginLoading}>
                {loginLoading ? "Нэвтэрч байна..." : "Нэвтрэх"}
              </Button>
              <div className="space-y-2">
                <FacebookButton onClick={handleFacebook}>Facebook-ээр үргэлжлүүлэх</FacebookButton>
                <GoogleButton onClick={handleGoogle}>Google-ээр үргэлжлүүлэх</GoogleButton>
              </div>
            </form>
          )}

          {/* Register form */}
          {tab === "register" && (
            <form
              className="space-y-5 rounded-2xl border p-6 md:p-8 bg-background/60 backdrop-blur shadow-soft"
              onSubmit={handleRegister}
            >
              <div>
                <Label htmlFor="reg-name">Нэр <span className="text-red-500">*</span></Label>
                <Input id="reg-name" type="text" value={regName} onChange={e => setRegName(e.target.value)} required className="mt-1" placeholder="Бүтэн нэрээ оруулна уу" />
              </div>
              <div>
                <Label htmlFor="reg-email">
                  Имэйл <span className="text-muted-foreground text-xs">(аль нэгийг оруулна уу)</span>
                </Label>
                <Input id="reg-email" type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} className="mt-1" autoComplete="email" placeholder="example@mail.com" />
              </div>
              <div>
                <Label htmlFor="reg-phone">Утасны дугаар</Label>
                <Input id="reg-phone" type="tel" value={regPhone} onChange={e => setRegPhone(e.target.value)} placeholder="99112233" className="mt-1" autoComplete="tel" />
              </div>
              <div>
                <Label htmlFor="reg-password">Нууц үг <span className="text-red-500">*</span></Label>
                <PasswordInput id="reg-password" value={regPassword} onChange={e => setRegPassword(e.target.value)} required className="mt-1" autoComplete="new-password" />
              </div>
              {regError && <p className="text-red-600 text-sm text-center">{regError}</p>}
              <Button type="submit" className="w-full" disabled={regLoading}>
                {regLoading ? "Бүртгэж байна..." : "Бүртгүүлэх"}
              </Button>
              <div className="space-y-2">
                <FacebookButton onClick={handleFacebook}>Facebook-ээр үргэлжлүүлэх</FacebookButton>
                <GoogleButton onClick={handleGoogle}>Google-ээр үргэлжлүүлэх</GoogleButton>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Ачааллаж байна...</div>}>
      <AuthForm />
    </Suspense>
  )
}
