import { NextResponse } from "next/server";
import { createOtp } from "@/lib/utils/otp";
import { sendOtpEmail } from "@/lib/email/resend";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/otp/resend
 * Resend OTP to user's email
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

    // Check if there's a recent OTP request (rate limiting)
    const recentOtp = await prisma.otp.findFirst({
      where: {
        email,
        createdAt: {
          gte: new Date(Date.now() - 60 * 1000), // Within last 60 seconds
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (recentOtp) {
      return NextResponse.json(
        { message: "Please wait 60 seconds before requesting a new OTP" },
        { status: 429 }
      );
    }

    // Create new OTP
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
        message: "New OTP sent successfully to your email",
        expiresIn: 10, // minutes
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in resend OTP:", error);
    return NextResponse.json(
      { message: "Failed to resend OTP" },
      { status: 500 }
    );
  }
}
