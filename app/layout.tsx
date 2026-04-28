import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "New Era - Online Learning Platform",
  description: "Чанартай хичээллүүд. Хэзээ ч, хаанаас ч.",
  generator: "New Era Platform",
  icons: {
    icon: "https://res.cloudinary.com/de6mcfkn5/image/upload/c_fill,w_32,h_32,r_max/v1756118989/535747480_1039722544773037_8538637132933638763_n_w4eofz.jpg",
    shortcut: "https://res.cloudinary.com/de6mcfkn5/image/upload/c_fill,w_32,h_32,r_max/v1756118989/535747480_1039722544773037_8538637132933638763_n_w4eofz.jpg",
    apple: "https://res.cloudinary.com/de6mcfkn5/image/upload/c_fill,w_180,h_180,r_max/v1756118989/535747480_1039722544773037_8538637132933638763_n_w4eofz.jpg",
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="mn" className={`${inter.variable} antialiased`} suppressHydrationWarning>
      <body className="font-sans bg-background text-foreground">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
