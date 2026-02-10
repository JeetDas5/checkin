import { getCurrentUser } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Get all users (with filters)
export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const domainId = searchParams.get("domainId");
    const role = searchParams.get("role");
    const q = searchParams.get("q");

    let where = {};

    // Role-based filtering
    if (user.role === "ADMIN") {
      // Admins can only see users from their domain
      where.domainId = user.domainId;
    } else if (user.role === "USER") {
      // Regular users can only see users from their domain
      where.domainId = user.domainId;
    }
    // SUPER_ADMIN can see all users

    // Apply additional filters
    if (domainId && ["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
      where.domainId = domainId;
    }
    if (role) {
      where.role = role;
    }
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { personalEmail: { contains: q, mode: "insensitive" } },
        { roll: { contains: q, mode: "insensitive" } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        personalEmail: true,
        roll: true,
        role: true,
        profile_pic: true,
        domainId: true,
        domain: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.log("Error fetching users", error);
    return NextResponse.json(
      { message: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
