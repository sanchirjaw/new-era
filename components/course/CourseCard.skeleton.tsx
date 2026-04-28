import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { CourseCardSkeletonProps } from "./types"

export function CourseCardSkeleton({ testId }: CourseCardSkeletonProps) {
  return (
    <Card 
      className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card"
      data-testid={testId ?? "course-card-skeleton"}
    >
      {/* Thumbnail skeleton */}
      <div className="relative aspect-video overflow-hidden">
        <Skeleton className="h-full w-full" />
        {/* Badge skeletons */}
        <div className="absolute left-3 top-3">
          <Skeleton className="h-6 w-16" />
        </div>
        <div className="absolute right-3 top-3">
          <Skeleton className="h-6 w-20" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* Title skeleton */}
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-5 w-1/2" />
        
        {/* Description skeleton */}
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />

        {/* Progress skeleton (sometimes shown) */}
        <div className="mt-1">
          <Skeleton className="h-2 w-full" />
          <Skeleton className="mt-1 h-3 w-20" />
        </div>

        {/* Metadata skeleton */}
        <div className="mt-auto flex items-center gap-3">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-16" />
        </div>

        {/* Buttons skeleton */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Skeleton className="col-span-2 h-10 sm:col-span-1" />
          <Skeleton className="col-span-2 h-10 sm:col-span-1" />
        </div>
      </div>
    </Card>
  )
}
