import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, verifyToken } from "@/lib/auth/auth";

export async function GET(request, { params }) {
  try {
    const { domainId } = await params;

    if(!domainId){
      return NextResponse.json({ error: "Domain ID is required" }, { status: 400 });
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Super Admin access only" },
        { status: 403 }
      );
    }

    const domain = await prisma.domain.findUnique({
      where: { id: domainId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    const members = await prisma.user.findMany({
      where: {
        domainId: domainId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        roll: true,
        role: true,
        profile_pic: true,
        createdAt: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      domain,
      members,
    });
  } catch (error) {
    console.error("Error fetching domain members:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
