import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, verifyToken } from "@/lib/auth/auth";

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        role: true,
        domainId: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user is admin or super admin
    if (currentUser.role !== "ADMIN" && currentUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Insufficient permissions" },
        { status: 403 }
      );
    }

    // For SUPER_ADMIN: Return all domains with member counts
    if (currentUser.role === "SUPER_ADMIN") {
      const domains = await prisma.domain.findMany({
        select: {
          id: true,
          name: true,
          createdAt: true,
          _count: {
            select: {
              users: true,
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      });

      return NextResponse.json({
        type: "domains",
        data: domains.map((domain) => ({
          id: domain.id,
          name: domain.name,
          memberCount: domain._count.users,
          createdAt: domain.createdAt,
        })),
      });
    }

    // For ADMIN: Return members from their domain
    if (currentUser.role === "ADMIN") {
      if (!currentUser.domainId) {
        return NextResponse.json(
          { error: "Admin has no associated domain" },
          { status: 400 }
        );
      }

      const members = await prisma.user.findMany({
        where: {
          domainId: currentUser.domainId,
          role: {
            not: "SUPER_ADMIN",
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          roll: true,
          role: true,
          profile_pic: true,
          createdAt: true,
          domain: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      });

      return NextResponse.json({
        type: "members",
        data: members,
      });
    }
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
