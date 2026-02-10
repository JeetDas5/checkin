import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { signUpSchema } from "@/lib/validators/user.schema";
import { prisma } from "@/lib/prisma";
import { hasVerifiedOtp, deleteVerifiedOtp } from "@/lib/utils/otp";

export async function POST(request) {
  try {
    const body = await request.json();
    const parsedBody = signUpSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { message: "Invalid request data", errors: parsedBody.error },
        { status: 400 }
      );
    }
    const { name, email, personalEmail, roll, password, role, domainId } =
      parsedBody.data;

    if (!name || !email || !personalEmail || !roll || !password) {
      return NextResponse.json(
        { message: "Name, emails, roll, and password are required" },
        { status: 400 }
      );
    }

    if (role && role === "ADMIN" && !domainId) {
      return NextResponse.json(
        { message: "Domain ID is required for ADMIN role" },
        { status: 400 }
      );
    }

    const existingUserOrRoll = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { roll }, { personalEmail }],
      },
    });

    if (existingUserOrRoll) {
      let conflictField = "Email or Roll";
      if (existingUserOrRoll.personalEmail === personalEmail)
        conflictField = "Personal Email";
      else if (existingUserOrRoll.email === email) conflictField = "KIIT Email";
      else if (existingUserOrRoll.roll === roll) conflictField = "Roll Number";

      return NextResponse.json(
        { message: `${conflictField} already exists` },
        { status: 409 }
      );
    }

    // Check if KIIT email has been verified with OTP
    const isOtpVerified = await hasVerifiedOtp(email);
    if (!isOtpVerified) {
      return NextResponse.json(
        {
          message: "Please verify your KIIT email with OTP before signing up",
        },
        { status: 403 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        personalEmail,
        roll,
        password: hashedPassword,
        role: role || "USER",
        domainId: domainId || null,
      },
    });
    if (!user) {
      return NextResponse.json(
        { message: "User not created" },
        { status: 500 }
      );
    }

    // Delete the verified OTP after successful signup
    await deleteVerifiedOtp(email);

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          domainId: user.domainId,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.log("Error signup:", error);
    if (error?.code === "P2002") {
      return NextResponse.json(
        { message: "Email already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json({ message: "Error signup" }, { status: 500 });
  }
}
