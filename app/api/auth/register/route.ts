import { NextRequest, NextResponse } from "next/server"
import { createUser, generateToken } from "@/lib/auth-server"

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, phone } = await request.json()

    if (!name || !password) {
      return NextResponse.json({ error: "Нэр болон нууц үг шаардлагатай" }, { status: 400 })
    }

    if (!email && !phone) {
      return NextResponse.json({ error: "Имэйл эсвэл утасны дугаарын аль нэгийг оруулна уу" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой" }, { status: 400 })
    }

    const user = await createUser(name, email || "", password, phone)
    const token = generateToken(user)

    const response = NextResponse.json({ user, success: true })
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error) {
    console.error("Registration error:", error)
    if (error instanceof Error && error.message === "User already exists") {
      return NextResponse.json({ error: "User already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
