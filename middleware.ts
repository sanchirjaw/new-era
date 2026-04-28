import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const url = request.nextUrl
  
  // Redirect www to apex domain
  if (url.hostname === "www.edunewera.mn") {
    url.hostname = "edunewera.mn";
    return NextResponse.redirect(url, 308);
  }

  const { pathname } = request.nextUrl

  // Admin routes protection - just check if user is trying to access admin pages
  // Authentication will be handled at the page level
  if (pathname.startsWith("/admin")) {
    // Allow access to admin login page
    if (pathname === "/admin/login") {
      return NextResponse.next()
    }
    
    // For other admin routes, let the page handle authentication
    return NextResponse.next()
  }

  // Protected routes
  if (pathname.startsWith("/dashboard") || (pathname.startsWith("/courses/") && pathname.includes("/watch"))) {
    // Let the page handle authentication
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/courses/:path*/watch", "/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
