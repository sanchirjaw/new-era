"use client"

import { useEffect, useState } from "react"

function isInAppBrowser(): boolean {
  if (typeof window === "undefined") return false
  const ua = navigator.userAgent || ""
  return (
    /LinkedInApp/i.test(ua) ||
    /FBAN|FBAV|FB_IAB/i.test(ua) ||
    /Instagram/i.test(ua) ||
    /Twitter/i.test(ua) ||
    /Line\//i.test(ua) ||
    (/iPhone|iPad/.test(ua) && !/Safari/.test(ua) && !/Chrome/.test(ua))
  )
}

export function InAppBrowserDetector() {
  const [show, setShow] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (isInAppBrowser()) setShow(true)
  }, [])

  if (!show) return null

  const url = typeof window !== "undefined" ? window.location.href : ""

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  const handleOpenBrowser = () => {
    // iOS Safari trick
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)
    if (isIOS) {
      window.location.href = "x-safari-" + url
    } else {
      // Android: intent scheme
      window.location.href = `intent://${url.replace(/^https?:\/\//, "")}#Intent;scheme=https;package=com.android.chrome;end`
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/80 px-6 text-center">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-3 text-4xl">🌐</div>
        <h2 className="mb-2 text-lg font-bold text-gray-900">
          Браузерт нээнэ үү
        </h2>
        <p className="mb-5 text-sm text-gray-500">
          Энэ хуудсыг зөв харахын тулд таны утасны браузерт (Safari эсвэл Chrome) нээнэ үү.
        </p>

        <button
          onClick={handleOpenBrowser}
          className="mb-3 w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white active:bg-blue-700"
        >
          Браузерт нээх
        </button>

        <button
          onClick={handleCopy}
          className="w-full rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-700 active:bg-gray-50"
        >
          {copied ? "✓ Холбоос хуулагдлаа" : "Холбоос хуулах"}
        </button>

        <p className="mt-4 text-xs text-gray-400">
          Хуулсны дараа браузерынхаа хаягийн мөрөнд буулгаж нээнэ үү
        </p>
      </div>
    </div>
  )
}
