"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { PriceBadge } from "@/components/ui/price-badge"
import {
  Lock,
  CheckCircle2,
  Play,
  Users,
  Star,
  Clock,
  Wallet
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { CourseCardProps } from "./types"

// Utility functions
function formatPrice(mnt?: number) {
  if (typeof mnt !== 'number') return '—'
  return new Intl.NumberFormat('mn-MN').format(mnt)
}

function fmtDuration(min?: number) {
  if (!min) return undefined
  const h = Math.floor(min / 60)
  const m = min % 60
  return h ? `${h}ц ${m}мин` : `${m}мин`
}

export function CourseCard({
  id,
  title,
  description,
  thumbnailUrl,
  rating,
  studentsCount,
  priceMnt,
  isEnrolled = false,
  progressPct,
  level,
  durationMinutes,
  teacherBadge,
  onOpen,
  onBuy,
  onContinue,
  testId
}: CourseCardProps) {
  const isFree = priceMnt === 0

  return (
    <TooltipProvider>
      <Card
        className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg hover:ring-1 hover:ring-black/5"
        data-testid={testId ?? `course-card-${id}`}
      >
        {/* Thumbnail area */}
        <div className="relative aspect-video overflow-hidden">
          {thumbnailUrl ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onOpen?.(id)}
                  className="h-full w-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  aria-label={`${title} постер`}
                >
                  <img
                    src={thumbnailUrl}
                    alt={title}
                    className={cn(
                      "h-full w-full object-cover transition-all duration-300",
                      isEnrolled ? "" : "grayscale group-hover:grayscale-50"
                    )}
                  />
                </button>
              </TooltipTrigger>
              {!isEnrolled && (
                <TooltipContent>
                  <p>Худалдаж аваад нээх</p>
                </TooltipContent>
              )}
            </Tooltip>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted/50 to-muted/30">
              <Play className="h-16 w-16 text-muted-foreground" />
            </div>
          )}

          {/* Teacher badge - top left */}
          <div className="absolute left-3 top-3 flex gap-2">
            {teacherBadge && (
              <Badge variant="secondary" className="backdrop-blur-sm">
                {teacherBadge}
              </Badge>
            )}
          </div>

          {/* Status/Price badge - top right */}
          <div className="absolute right-3 top-3">
            {isEnrolled ? (
              <Badge
                className="bg-emerald-600/90 text-white backdrop-blur-sm"
                role="status"
                aria-label="Элссэн хичээл"
              >
                <CheckCircle2 className="mr-1 h-4 w-4" />
                Элссэн
              </Badge>
            ) : (
              priceMnt !== undefined && (
                <PriceBadge price={priceMnt} />
              )
            )}
          </div>

          {/* Lock overlay for unpaid courses */}
          {!isEnrolled && (
            <div className="absolute inset-0 grid place-items-center bg-black/10 transition-all duration-300 group-hover:bg-black/5">
              <Lock className="h-10 w-10 text-white/90 drop-shadow transition-transform duration-300 group-hover:scale-110" />
            </div>
          )}

          {/* Play indicator for enrolled courses */}
          {isEnrolled && (
            <div className="absolute bottom-3 right-3">
              <div className="rounded-full bg-black/50 p-1 backdrop-blur-sm">
                <Play className="h-4 w-4 text-white" />
              </div>
            </div>
          )}
        </div>

        {/* Content area */}
        <div className="flex flex-1 flex-col gap-2 p-4">
          {/* Title */}
          <h3 className="line-clamp-2 text-base font-semibold leading-tight">
            {title}
          </h3>

          {/* Description */}
          {description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {description}
            </p>
          )}

          {/* Progress bar for enrolled users */}
          {isEnrolled && typeof progressPct === 'number' && (
            <div className="mt-1">
              <Progress
                value={progressPct}
                className="h-2"
                aria-valuenow={progressPct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Хичээлийн дэвшил: ${progressPct}%`}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Дэвшил: {progressPct}%
              </p>
            </div>
          )}

          {/* Metadata row */}
          <div className="mt-auto flex items-center gap-3 text-xs text-muted-foreground">
            {typeof rating === 'number' && (
              <span className="inline-flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                {rating.toFixed(1)}
              </span>
            )}
            {!rating && (
              <span className="inline-flex items-center gap-1">
                <Star className="h-3 w-3" />
                Шинэ
              </span>
            )}
            {typeof studentsCount === 'number' && (
              <>
                <span className="text-muted-foreground/50">•</span>
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {studentsCount}
                </span>
              </>
            )}
            {typeof durationMinutes === 'number' && (
              <>
                <span className="text-muted-foreground/50">•</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {fmtDuration(durationMinutes)}
                </span>
              </>
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            {isEnrolled ? (
              <>
                <Button
                  onClick={() => onContinue?.(id)}
                  className="col-span-2 bg-emerald-600 hover:bg-emerald-600/90 sm:col-span-1"
                  aria-label={`${title} хичээл үзэх`}
                  data-testid="continue-btn"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Хичээл үзэх
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onOpen?.(id)}
                  className="col-span-2 sm:col-span-1"
                  aria-label={`${title} тойм харах`}
                >
                  Тойм
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => onBuy?.(id)}
                  className="col-span-2 bg-blue-600 hover:bg-blue-600/90 sm:col-span-1"
                  aria-label={`${title} худалдаж авах`}
                  data-testid="buy-btn"
                >
                  {isFree ? (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Үнэгүй эхлүүлэх
                    </>
                  ) : (
                    <>
                      <Wallet className="mr-2 h-4 w-4" />
                      Худалдаж авах
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => onOpen?.(id)}
                  className="col-span-2 sm:col-span-1"
                  aria-label={`${title} тойм харах`}
                >
                  Тойм харах
                </Button>
              </>
            )}
          </div>


        </div>
      </Card>
    </TooltipProvider>
  )
}
