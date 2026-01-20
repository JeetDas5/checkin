import { setAuthCookie, signToken } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { signInSchema } from "@/lib/validators/user.schema";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    const body = await request.json();
    const parsedBody = signInSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { message: "Invalid request", errors: parsedBody.error.errors },
        { status: 400 }
      );
    }

    const { email, password } = parsedBody.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!user || !isValidPassword) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }
    const token = signToken({ id: user.id });
    if (!token) {
      return NextResponse.json(
        { message: "Failed to generate token" },
        { status: 500 }
      );
    }
    await setAuthCookie(token);

    return NextResponse.json(
      {
        message: "Signin successful",
        user,
        token,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error at signin", error);
    return NextResponse.json({ message: "Failed to signin" }, { status: 500 });
  }
}
