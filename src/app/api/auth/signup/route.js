import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { signUpSchema } from "@/lib/validators/user.schema";
import { prisma } from "@/lib/prisma";

export async function POST(request) {
  try {
    const body = await request.json();
    const parsedBody = signUpSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { message: "Invalid request data", errors: parsedBody.error.errors },
        { status: 400 }
      );
    }
    const { name, email, roll, password, role, domainId } = parsedBody.data;

    if (!name || !email || !roll || !password) {
      return NextResponse.json(
        { message: "Name, email, roll, and password are required" },
        { status: 400 }
      );
    }

    const existingUserOrRoll = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { roll }],
      },
    });

    if (existingUserOrRoll) {
      return NextResponse.json(
        { message: "Email or Roll already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
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
