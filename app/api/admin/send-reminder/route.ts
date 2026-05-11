import { NextRequest, NextResponse } from "next/server"
import { getAdminUser } from "@/lib/auth-server"
import { db } from "@/lib/database"
import { Resend } from "resend"
import { ObjectId } from "mongodb"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  const admin = await getAdminUser(request)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { userIds } = await request.json()
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return NextResponse.json({ error: "No users specified" }, { status: 400 })
  }

  let sent = 0
  const errors: string[] = []

  for (const userId of userIds) {
    try {
      const user = await db.getUserById(new ObjectId(userId))
      if (!user || !user.email) continue

      await resend.emails.send({
        from: "NewEra <noreply@edunewera.mn>",
        to: user.email,
        subject: "NewEra сургалтад элсэх цаг болжээ 🎓",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #16a34a; font-size: 28px; margin: 0;">NewEra</h1>
              <p style="color: #6b7280; margin: 5px 0 0;">Онлайн сургалтын платформ</p>
            </div>

            <h2 style="color: #111827; font-size: 22px;">Сайн байна уу, ${user.name}!</h2>

            <p style="color: #374151; line-height: 1.6;">
              Та NewEra платформд бүртгэлтэй боловч одоог хүртэл сургалтад элсээгүй байна.
              Манай сургалтуудаас суралцаж, мэдлэгээ өргөжүүлэх боломж танийг хүлээж байна.
            </p>

            <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; border-radius: 8px; margin: 24px 0;">
              <p style="color: #15803d; font-weight: bold; margin: 0 0 8px;">✨ Яагаад NewEra-г сонгох вэ?</p>
              <ul style="color: #374151; margin: 0; padding-left: 20px; line-height: 1.8;">
                <li>Мэргэжлийн багш нарын хичээлүүд</li>
                <li>Хэзээ ч, хаанаас ч үзэх боломж</li>
                <li>Практик дасгал, даалгаврууд</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 32px 0;">
              <a href="https://edunewera.mn/courses"
                style="background: #16a34a; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
                Сургалтуудыг үзэх →
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 16px;">
              NewEra • edunewera.mn<br/>
              Та энэ имэйлийг хүлээн авахыг хүсэхгүй байгаа бол хэрэглэгчийн тохиргооноос гарч болно.
            </p>
          </div>
        `
      })
      sent++
    } catch (err) {
      errors.push(userId)
    }
  }

  return NextResponse.json({ sent, errors })
}
