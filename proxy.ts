import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function proxy(request: NextRequest) {
  const url = request.nextUrl

  // Redirect www to apex domain
  if (url.hostname === "www.edunewera.mn") {
    url.hostname = "edunewera.mn"
    return NextResponse.redirect(url, 308)
  }

  const { pathname } = request.nextUrl

  // Admin routes protection
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") {
      return NextResponse.next()
    }
    return NextResponse.next()
  }

  // Protected routes
  if (pathname.startsWith("/dashboard") || (pathname.startsWith("/courses/") && pathname.includes("/watch"))) {
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/courses/:path*/watch", "/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
