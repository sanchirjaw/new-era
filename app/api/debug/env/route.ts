import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 })
  }

  const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    QPAY_BASE_URL: process.env.QPAY_BASE_URL ? "Set" : "Not set",
    QPAY_USERNAME: process.env.QPAY_USERNAME ? "Set" : "Not set",
    QPAY_PASSWORD: process.env.QPAY_PASSWORD ? "Set" : "Not set",
    QPAY_INVOICE_CODE: process.env.QPAY_INVOICE_CODE ? "Set" : "Not set",
    BYL_API_BASE_URL: process.env.BYL_API_BASE_URL ? "Set" : "Not set",
    BYL_PROJECT_ID: process.env.BYL_PROJECT_ID ? "Set" : "Not set",
    BYL_API_TOKEN: process.env.BYL_API_TOKEN ? "Set" : "Not set",
    MONGODB_URI: process.env.MONGODB_URI ? "Set" : "Not set",
    JWT_SECRET: process.env.JWT_SECRET ? "Set" : "Not set",
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL ? "Set" : "Not set"
  }

  return NextResponse.json({ 
    message: "Environment variables status",
    envVars,
    timestamp: new Date().toISOString()
  })
}
