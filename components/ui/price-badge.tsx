import { cn } from "@/lib/utils"

interface PriceBadgeProps {
  price: number
  className?: string
}

export function PriceBadge({ price, className }: PriceBadgeProps) {
  const formatPrice = (mnt: number) => {
    return new Intl.NumberFormat('mn-MN').format(mnt)
  }

  return (
    <div className={cn(
      "inline-flex items-center rounded-md bg-blue-600/90 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm",
      className
    )}>
      ₮{formatPrice(price)}
    </div>
  )
}
