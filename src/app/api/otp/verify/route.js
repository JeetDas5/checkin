import { NextResponse } from "next/server";
import { verifyOtp } from "@/lib/utils/otp";

/**
 * POST /api/otp/verify
 * Verify OTP code
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { message: "Email and OTP are required" },
        { status: 400 }
      );
    }

    // Verify OTP
    const result = await verifyOtp(email, otp);

    if (!result.success) {
      return NextResponse.json({ message: result.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        message: result.message,
        verified: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in verify OTP:", error);
    return NextResponse.json(
      { message: "Failed to verify OTP" },
      { status: 500 }
    );
  }
}
