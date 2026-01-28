import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/auth";
import { requireRole } from "@/lib/auth/rbac";
import { createDomainSchema } from "@/lib/validators/domain.schema";
import { prisma } from "@/lib/prisma";

export async function POST(req) {
  const currentUser = await getCurrentUser();

  if (!requireRole(currentUser, ["SUPER_ADMIN"])) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createDomainSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation error", errors: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const existingDomain = await prisma.domain.findUnique({
      where: { name: parsed.data.name },
    });

    if (existingDomain) {
      return NextResponse.json(
        { message: "Domain already exists" },
        { status: 409 }
      );
    }

    const domain = await prisma.domain.create({
      data: { name: parsed.data.name },
    });

    if (!domain) {
      return NextResponse.json(
        { message: "Domain not created" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Domain created", domain },
      { status: 201 }
    );
  } catch (err) {
    if (err?.code === "P2002") {
      return NextResponse.json(
        { message: "Domain already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { message: "Server error", error: String(err) },
      { status: 500 }
    );
  }
}

export async function GET() {

  const domains = await prisma.domain.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ domains }, { status: 200 });
}
