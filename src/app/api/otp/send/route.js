import { NextResponse } from "next/server";
import { createOtp } from "@/lib/utils/otp";
import { sendOtpEmail } from "@/lib/email/resend";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/otp/send
 * Send OTP to user's email
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { email, name } = body;

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if user already exists with this email (either as KIIT or personal email)
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { personalEmail: email }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "This email is already registered" },
        { status: 409 }
      );
    }

    // Create OTP
    const otpRecord = await createOtp(email);

    // Send OTP email
    try {
      await sendOtpEmail(email, otpRecord.otp, name || "User");
    } catch (emailError) {
      console.error("Error sending OTP email:", emailError);
      // Delete the OTP if email fails
      await prisma.otp.delete({
        where: { id: otpRecord.id },
      });
      return NextResponse.json(
        { message: "Failed to send OTP email. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "OTP sent successfully to your email",
        expiresIn: 10, // minutes
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in send OTP:", error);
    return NextResponse.json(
      { message: "Failed to send OTP" },
      { status: 500 }
    );
  }
}
