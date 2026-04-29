import Link from "next/link"
import { Facebook, Instagram, Send, Mail, Phone, MapPin } from "lucide-react"

const GRAD = "linear-gradient(135deg, #00E5A0 0%, #7B61FF 100%)"

export function Footer() {
  return (
    <footer className="bg-background border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 py-10 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-10">

          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <span className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-lg flex-shrink-0"
                style={{ background: GRAD }}>N</span>
              <span className="text-xl font-black tracking-tight text-foreground">
                New<span className="bg-clip-text text-transparent" style={{ backgroundImage: GRAD }}>Era</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5 max-w-xs">
              Ур чадвараа хөгжүүлж, ирээдүйгээ өөрчил. Монголын тэргүүлэх онлайн сургалтын платформ.
            </p>
            <div className="flex gap-3">
              {[
                { href: "https://www.facebook.com/profile.php?id=61550966794682", icon: <Facebook className="w-4 h-4" />, label: "Facebook", color: "#1877F2" },
                { href: "https://www.instagram.com/newera_mn/", icon: <Instagram className="w-4 h-4" />, label: "Instagram", color: "#E1306C" },
                { href: "https://t.me/+iLJnSiDesicxMjU1", icon: <Send className="w-4 h-4" />, label: "Telegram", color: "#229ED9" },
              ].map(s => (
                <Link key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-transform hover:scale-110"
                  style={{ backgroundColor: s.color }}>
                  {s.icon}
                </Link>
              ))}
            </div>
          </div>

          {/* 3 columns in one row on mobile */}
          <div className="col-span-1 md:contents">
            <div className="grid grid-cols-3 gap-4 md:contents">

              {/* Navigation */}
              <div>
                <h4 className="font-bold text-xs md:text-sm text-foreground mb-3 uppercase tracking-wider">Навигаци</h4>
                <ul className="space-y-2">
                  {[
                    { href: "/", label: "Нүүр" },
                    { href: "/courses", label: "Хичээлүүд" },
                    { href: "/dashboard", label: "Миний хичээл" },
                    { href: "/profile", label: "Профайл" },
                  ].map(l => (
                    <li key={l.href}>
                      <Link href={l.href}
                        className="text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors inline-block">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Platform */}
              <div>
                <h4 className="font-bold text-xs md:text-sm text-foreground mb-3 uppercase tracking-wider">Онцлог</h4>
                <ul className="space-y-2">
                  {[
                    "HD видео",
                    "Мэргэжлийн багш",
                    "24/7 дэмжлэг",
                    "Гэрчилгээ",
                  ].map(t => (
                    <li key={t} className="text-xs md:text-sm text-muted-foreground flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: GRAD }} />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contact */}
              <div>
                <h4 className="font-bold text-xs md:text-sm text-foreground mb-3 uppercase tracking-wider">Холбоо</h4>
                <ul className="space-y-2.5">
                  <li className="flex items-start gap-1.5">
                    <Mail className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-muted-foreground" />
                    <a href="mailto:asanchir59@gmail.com"
                      className="text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors break-all">
                      asanchir59@gmail.com
                    </a>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Phone className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-muted-foreground" />
                    <a href="tel:+97699638369"
                      className="text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors">
                      +976 99638369
                    </a>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-muted-foreground" />
                    <span className="text-xs md:text-sm text-muted-foreground">Улаанбаатар</span>
                  </li>
                </ul>
              </div>

            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex gap-4">
            <Link href="#" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Terms of Service</Link>
          </div>
          <p>
            © 2025 New Era. Made by{" "}
            <a href="https://xp-hazel-eta.vercel.app" target="_blank" rel="noopener noreferrer"
              className="font-bold bg-clip-text text-transparent hover:opacity-80 transition-opacity"
              style={{ backgroundImage: GRAD }}>
              XP Team
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
