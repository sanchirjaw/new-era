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
import { signIn } from "next-auth/react"

function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { login } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Check for OAuth error messages
  useEffect(() => {
    const oauthError = searchParams.get('error')
    if (oauthError) {
      switch (oauthError) {
        case 'oauth_not_configured':
          setError('Google нэвтрэлт тохиргоогүй байна. Админтай холбогдоно уу.')
          break
        case 'google_auth_failed':
          setError('Google баталгаажуулалт амжилтгүй. Дахин оролдоно уу.')
          break
        case 'no_code':
          setError('Баталгаажуулах код хүлээн авагдсангүй. Дахин оролдоно уу.')
          break
        case 'no_id_token':
          setError('Баталгаажуулах токен хүлээн авагдсангүй. Дахин оролдоно уу.')
          break
        case 'no_email':
          setError('Google-ээс имэйл өгөгдсөнгүй. Дахин оролдоно уу.')
          break
        case 'user_creation_failed':
          setError('Хэрэглэгчийн бүртгэл үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.')
          break
        case 'oauth_failed':
          setError('OAuth баталгаажуулалт амжилтгүй. Дахин оролдоно уу.')
          break
        default:
          setError('Баталгаажуулалт амжилтгүй. Дахин оролдоно уу.')
      }
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const success = await login(email, password)
    if (success) {
      // Add a small delay to ensure the user state is updated
      setTimeout(() => {
        router.push("/")
      }, 100)
    } else {
      setError("Имэйл эсвэл нууц үг буруу байна")
    }
    setLoading(false)
  }

  const handleGoogleLogin = async () => {
    setError("")
    try {
      await signIn("google", { 
        callbackUrl: "/",
        redirect: true 
      })
    } catch (error) {
      setError("Google баталгаажуулалт амжилтгүй. Дахин оролдоно уу.")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex items-center justify-center py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground">Нэвтрэх</h2>
          </div>
          <form className="space-y-6 rounded-2xl border p-6 md:p-8 bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-soft animate-authIn focus-within:shadow-lg transition-all" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="email">Имэйл</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
                autoComplete="email"
              />
            </div>
            <div>
              <Label htmlFor="password">Нууц үг</Label>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1"
                autoComplete="current-password"
              />
            </div>
            <div className="text-right">
              <Link href="/reset-password" className="text-sm text-primary hover:text-primary/80 transition-colors">
                Нууц үгээ мартсан уу?
              </Link>
            </div>
            {error && (
              <div className="text-red-600 text-sm text-center" aria-live="polite">{error}</div>
            )}
            <Button
              type="submit"
              className="w-full transition-all hover:scale-[1.01] active:scale-[.99] hover:shadow-md hover:-translate-y-[1px] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
              disabled={loading}
            >
              {loading ? "Нэвтэрч байна..." : "Нэвтрэх"}
            </Button>
            <GoogleButton onClick={handleGoogleLogin}>
              Google-ээр үргэлжлүүлэх
            </GoogleButton>
          </form>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Бүртгэл байхгүй юу?{" "}
              <Link href="/register" className="text-primary hover:text-primary/80 transition-colors">
                Бүртгүүлэх
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Ачааллаж байна...</div>}>
      <LoginForm />
    </Suspense>
  )
}
