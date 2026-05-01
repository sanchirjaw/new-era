export type CourseCardProps = {
  id: string
  title: string
  description?: string
  thumbnailUrl?: string
  rating?: number // 0-5
  studentsCount?: number
  priceMnt?: number // null/undefined when free or already purchased pricing hidden
  originalPriceMnt?: number // for showing strikethrough discount
  accessDurationMonths?: number | null // null = lifetime
  isEnrolled?: boolean
  expiresAt?: string | null // ISO date string or null = lifetime
  progressPct?: number // 0-100, only for enrolled users
  level?: 'beginner' | 'intermediate' | 'advanced'
  durationMinutes?: number
  teacherBadge?: string // e.g., "medkue"
  onOpen?: (id: string) => void // open details
  onBuy?: (id: string) => void // buy flow
  onContinue?: (id: string) => void // continue learning
  testId?: string // for tests
}

export type CourseCardSkeletonProps = {
  testId?: string
}
