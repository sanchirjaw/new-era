import Link from "next/link"
import { Facebook, Instagram, Send } from "lucide-react"

const GRAD = "linear-gradient(135deg, #00E5A0 0%, #7B61FF 100%)"

export function Footer() {
  return (
    <footer className="bg-background border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <span
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-lg"
                style={{ background: GRAD }}
              >
                N
              </span>
              <span className="font-black text-lg text-foreground">
                New
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: GRAD }}>
                  Era
                </span>
              </span>
            </div>
            <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
              Ур чадвараа хөгжүүлж, ирээдүйгээ өөрчлөх цаг болсон.
              Мэргэжлийн багш нартай чанартай хичээлүүд таныг хүлээж байна.
            </p>
            <div className="flex space-x-4">
              <Link
                href="https://www.facebook.com/profile.php?id=61550966794682"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-500 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </Link>
              <Link
                href="https://www.instagram.com/newera_mn/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-pink-500 hover:text-pink-400 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </Link>
              <Link
                href="https://t.me/+iLJnSiDesicxMjU1"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-500 hover:text-sky-400 transition-colors"
                aria-label="Telegram"
              >
                <Send className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Features */}
          <div>
            <h3 className="font-bold text-base mb-4 text-foreground">Платформын онцлогууд</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• HD чанартай видео хичээллүүд</li>
              <li>• Мэргэжлийн багш нар</li>
              <li>• 24/7 дэмжлэг</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-base mb-4 text-foreground">Холбоо барих</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>📧 asanchir59@gmail.com</li>
              <li>📞 +976 99638369</li>
              <li>📍 Улаанбаатар, Монгол</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="flex space-x-4 text-sm">
              <Link href="#" className="hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
            </div>
            <p className="text-sm">
              © 2025 New Era. All rights reserved. Made by{" "}
              <a
                href="https://xp-hazel-eta.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold bg-clip-text text-transparent hover:opacity-80 transition-opacity"
                style={{ backgroundImage: GRAD }}
              >
                XP Team
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
