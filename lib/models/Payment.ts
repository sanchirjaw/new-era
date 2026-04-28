import type { ObjectId } from "mongodb"

export interface Payment {
  _id?: ObjectId
  userId: ObjectId
  courseId: ObjectId
  amount: number
  currency: string
  qpayInvoiceId?: string
  qpayTransactionId?: string
  bylInvoiceId?: number
  bylCheckoutId?: number
  status: "pending" | "completed" | "failed" | "refunded"
  paymentMethod: "qpay" | "byl" | "bank_transfer"
  bankTransferReference?: string
  createdAt: Date
  updatedAt: Date
}
