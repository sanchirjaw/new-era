import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Get all cookies
    const allCookies = request.cookies.getAll()
    const adminToken = request.cookies.get("admin-token")?.value
    const authToken = request.cookies.get("auth-token")?.value
    
    console.log("Admin auth debug - all cookies:", allCookies.map(c => ({ name: c.name, value: c.value ? 'Set' : 'Not set' })))
    console.log("Admin auth debug - admin-token:", adminToken ? 'Set' : 'Not set')
    console.log("Admin auth debug - auth-token:", authToken ? 'Set' : 'Not set')
    
    return NextResponse.json({ 
      success: true,
      cookies: {
        all: allCookies.map(c => ({ name: c.name, value: c.value ? 'Set' : 'Not set' })),
        adminToken: adminToken ? 'Set' : 'Not set',
        authToken: authToken ? 'Set' : 'Not set'
      },
      headers: Object.fromEntries(request.headers.entries())
    })
  } catch (error) {
    console.error("Admin auth debug error:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
