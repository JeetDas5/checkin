import { prisma } from "@/lib/prisma";
import { createUserSchema } from "@/lib/validators/user.schema";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    return NextResponse.json("User route is working fine", { status: 200 });
  } catch (error) {
    return NextResponse.json("Internal Server Error at /api/(auth)/users", {
      status: 500,
    });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    const parsedBody = createUserSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { message: "Validation error", errors: parsedBody.error.flatten() },
        { status: 400 }
      );
    }

    if (!parsedBody.success) {
      return NextResponse.json({ message: "Invalid data" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: parsedBody.data.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 409 }
      );
    }

    //check if domainId exists if provided
    if (parsedBody.data.domainId) {
      const domain = await prisma.domain.findUnique({
        where: { id: parsedBody.data.domainId },
      });

      if (!domain) {
        return NextResponse.json(
          { message: "Domain not found" },
          { status: 404 }
        );
      }
    }

    const data = parsedBody.data;
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        domainId: data.domainId ?? null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        domainId: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { message: "User created", user },
      { status: 201 }
    );
  } catch (err) {
    if (err?.code === "P2002") {
      return NextResponse.json(
        { message: "Email already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: "Server error", error: String(err) },
      { status: 500 }
    );
  }
}
