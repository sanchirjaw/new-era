import { NextRequest, NextResponse } from "next/server"
import { authenticateUser, generateToken } from "@/lib/auth-server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "И-мэйл болон нууц үг шаардлагатай" }, { status: 400 })
    }

    const user = await authenticateUser(email, password)

    if (!user) {
      return NextResponse.json({ error: "И-мэйл эсвэл нууц үг буруу байна" }, { status: 401 })
    }

    if (user.role !== "admin") {
      return NextResponse.json({ error: "Админ эрх шаардлагатай" }, { status: 403 })
    }

    const token = generateToken(user)
    console.log("Admin login - generated token for user:", user.email, "role:", user.role)

    // Set separate admin cookie to avoid conflicts with regular user auth
    const cookieStore = await cookies()
    cookieStore.set("admin-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })
    console.log("Admin login - admin-token cookie set")

    return NextResponse.json({
      message: "Амжилттай нэвтэрлээ",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("Admin login error:", error)
    return NextResponse.json({ error: "Серверийн алдаа гарлаа" }, { status: 500 })
  }
}
