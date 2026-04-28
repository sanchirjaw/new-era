import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { db } from "@/lib/database"
import { ObjectId } from "mongodb"
import crypto from "crypto"

const resend = new Resend('re_6b8a9G78_9jjmGykyMhybiCANMADTQDYE')

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await db.getUserByEmail(email)
    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json(
        { message: "If an account with that email exists, a reset link has been sent." },
        { status: 200 }
      )
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex")
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour

    // Save reset token to user
    await db.updateUser(user._id!, {
      resetToken,
      resetTokenExpiry,
    })

    // Create reset URL
    const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password/confirm?token=${resetToken}`

    console.log("About to send email to:", email)
    console.log("Reset URL:", resetUrl)
    console.log("Reset token:", resetToken)

    // Send email using Resend
    try {
      const emailResult = await resend.emails.send({
        from: "noreply@send.edunewera.mn", // Replace 'yourdomain.com' with your actual domain
        to: email, // Send to the actual user's email
        subject: "Password Reset Request",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p>You requested a password reset for your account.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${resetUrl}" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">
              Reset Password
            </a>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this reset, please ignore this email.</p>
            <p>Best regards,<br>Your App Team</p>
          </div>
        `,
      })
      
      console.log("Email sent successfully:", emailResult)
    } catch (emailError) {
      console.error("Email sending failed:", emailError)
      throw emailError
    }

    return NextResponse.json(
      { message: "If an account with that email exists, a reset link has been sent." },
      { status: 200 }
    )
  } catch (error) {
    console.error("Password reset error:", error)
    return NextResponse.json(
      { error: "Failed to process password reset request" },
      { status: 500 }
    )
  }
}
