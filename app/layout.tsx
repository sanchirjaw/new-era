import type React from "react"
import type { Metadata } from "next"
import { Outfit, DM_Sans, Space_Mono } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
  weight: ["400", "500", "600", "700", "800", "900"],
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
  weight: ["400", "500", "600", "700"],
})

const spaceMono = Space_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-mono",
  weight: ["400", "700"],
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
    <html
      lang="mn"
      className={`${outfit.variable} ${dmSans.variable} ${spaceMono.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="font-sans bg-background text-foreground">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
