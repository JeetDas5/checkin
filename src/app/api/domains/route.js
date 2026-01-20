import { prisma } from "@/lib/prisma";
import { createDomainSchema } from "@/lib/validators/domain.schema";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const domains = await prisma.domain.findMany({
      orderBy: { createdAt: "desc" },
    });

    console.log(domains);

    return NextResponse.json({ domains }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { message: "Failed to fetch domains" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const parsedBody = createDomainSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        {
          message: "Domain Validation error",
          errors: parsedBody.error.flatten(),
        },
        { status: 400 }
      );
    }

    const domain = await prisma.domain.create({
      data: {
        name: parsedBody.data.name,
      },
    });

    if (!domain) {
      return NextResponse.json(
        { message: "Failed to create domain" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Domain created successfully", domain },
      { status: 201 }
    );
  } catch (error) {
    console.log("Error creating domain", error);

    if (err?.code === "P2002") {
      return NextResponse.json(
        { message: "Domain already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json("Error creating domain", {
      status: 500,
    });
  }
}
