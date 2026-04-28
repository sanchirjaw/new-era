import Image from "next/image"

export function Logo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <Image
      src="https://res.cloudinary.com/de6mcfkn5/image/upload/v1756118989/535747480_1039722544773037_8538637132933638763_n_w4eofz.jpg"
      alt="NewEra Logo"
      width={32}
      height={32}
      className={`rounded-full ${className}`}
      priority
    />
  )
}
