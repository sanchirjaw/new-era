import { NextRequest, NextResponse } from "next/server"
import { getAdminUser } from "@/lib/auth-server"
import { ObjectId } from "mongodb"

export async function DELETE(request: NextRequest) {
  const admin = await getAdminUser(request)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { paymentId } = await request.json()
  if (!paymentId) return NextResponse.json({ error: "paymentId required" }, { status: 400 })

  const client = await (await import("@/lib/mongodb")).default
  const db = client.db("new-era-platform")

  // Only allow deleting pending payments
  const payment = await db.collection("payments").findOne({ _id: new ObjectId(paymentId) })
  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 })
  if (payment.status !== "pending") {
    return NextResponse.json({ error: "Зөвхөн хүлээгдэж буй төлбөрийг устгах боломжтой" }, { status: 400 })
  }

  await db.collection("payments").deleteOne({ _id: new ObjectId(paymentId) })

  return NextResponse.json({ success: true })
}
