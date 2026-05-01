"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Play, Lock } from "lucide-react"
import { getDisplayTitle, getDisplayDescription } from "@/lib/course-utils"
import type { Course } from "@/lib/types"

interface Props { courses: Course[] }

export function HomeCoursesSection({ courses }: Props) {
  const router = useRouter()
  if (courses.length === 0) return null

  return (
    <section className="ne-divider py-20 md:py-28">
      <div className="w-full max-w-6xl mx-auto px-5 md:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="ne-label mb-4">Хичээлүүд</div>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-foreground
              tracking-[-1.5px] leading-tight">
              Бүх хичээлүүд
            </h2>
          </div>
          <Link href="/courses">
            <button className="shrink-0 h-9 px-5 border border-border rounded-xl
              ne-label hover:border-border/80 hover:text-foreground
              transition-colors whitespace-nowrap">
              Бүгдийг үзэх →
            </button>
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map(course => (
            <button key={course._id}
              onClick={() => router.push(`/courses/${course._id}`)}
              className="ne-card text-left overflow-hidden group w-full">
              {/* Thumbnail */}
              <div className="aspect-video bg-muted relative overflow-hidden">
                {course.thumbnailUrl ? (
                  <img src={course.thumbnailUrl} alt={course.title || ""}
                    className="w-full h-full object-cover opacity-80
                      group-hover:opacity-100 transition-opacity duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play className="w-6 h-6 text-muted-foreground/30" />
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 flex items-center justify-center
                  bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm
                    border border-border flex items-center justify-center">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>

                {/* Category */}
                {course.category && (
                  <div className="absolute top-3 left-3 px-2.5 py-1 bg-background/80
                    backdrop-blur-sm rounded-md border border-border">
                    <span className="ne-label">{course.category}</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-display font-semibold text-foreground text-sm
                  leading-snug mb-1 line-clamp-2">
                  {getDisplayTitle(course.title)}
                </h3>
                <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2 mb-4">
                  {getDisplayDescription(course.title, course.description)}
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-display font-black text-base text-foreground">
                    {course.price === 0
                      ? <span className="text-sm font-bold" style={{ color: "var(--ne-accent)" }}>Үнэгүй</span>
                      : `₮${course.price?.toLocaleString() || "—"}`
                    }
                  </span>
                  {typeof course.enrolledCount === "number" && (
                    <span className="ne-label">{course.enrolledCount} сурагч</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
