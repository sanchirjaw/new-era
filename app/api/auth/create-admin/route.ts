import { NextRequest, NextResponse } from "next/server"
import { createAdminUser } from "@/lib/auth-server"

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ 
        error: "Нэр, имэйл болон нууц үг шаардлагатай" 
      }, { status: 400 })
    }

    // Check if admin already exists
    // For now, we'll allow creation of admin users
    // In production, you might want to restrict this

    const adminUser = await createAdminUser(name, email, password)

    return NextResponse.json({
      message: "Админ хэрэглэгч амжилттай үүслээ",
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
      },
    })
  } catch (error: any) {
    console.error("Admin creation error:", error)
    
    if (error.message === "User already exists") {
      return NextResponse.json({ 
        error: "Энэ имэйл хаягтай хэрэглэгч аль хэдийн байна" 
      }, { status: 409 })
    }
    
    return NextResponse.json({ 
      error: "Серверийн алдаа гарлаа" 
    }, { status: 500 })
  }
}
