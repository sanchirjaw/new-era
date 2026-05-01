import { cn } from "@/lib/utils"

interface PriceBadgeProps {
  price: number
  durationMonths?: number | null
  className?: string
}

export function PriceBadge({ price, durationMonths, className }: PriceBadgeProps) {
  const formatPrice = (mnt: number) => {
    return new Intl.NumberFormat('mn-MN').format(mnt)
  }

  return (
    <div className={cn(
      "inline-flex items-center gap-1 rounded-md bg-blue-600/90 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm",
      className
    )}>
      ₮{formatPrice(price)}
      {durationMonths ? (
        <span className="opacity-80">/ {durationMonths} сар</span>
      ) : null}
    </div>
  )
}
