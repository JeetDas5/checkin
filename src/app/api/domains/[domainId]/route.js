import { getCurrentUser } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Get specific domain details
export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { domainId } = await params;

    const domain = await prisma.domain.findUnique({
      where: { id: domainId },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            roll: true,
            role: true,
            profile_pic: true,
          },
        },
        events: {
          select: {
            id: true,
            title: true,
            date: true,
            status: true,
          },
          orderBy: {
            date: "desc",
          },
        },
      },
    });

    if (!domain) {
      return NextResponse.json(
        { message: "Domain not found" },
        { status: 404 }
      );
    }

    // Calculate statistics
    const stats = {
      totalUsers: domain.users.length,
      totalEvents: domain.events.length,
      openEvents: domain.events.filter((e) => e.status === "OPEN").length,
      closedEvents: domain.events.filter((e) => e.status === "CLOSED").length,
      admins: domain.users.filter((u) => u.role === "ADMIN").length,
      members: domain.users.filter((u) => u.role === "USER").length,
    };

    return NextResponse.json(
      {
        domain: {
          id: domain.id,
          name: domain.name,
          createdAt: domain.createdAt,
          updatedAt: domain.updatedAt,
        },
        users: domain.users,
        events: domain.events,
        stats,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error fetching domain details", error);
    return NextResponse.json(
      { message: "Failed to fetch domain details" },
      { status: 500 }
    );
  }
}

// Delete domain (SUPER_ADMIN only)
export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { domainId } = await params;

    const domain = await prisma.domain.findUnique({
      where: { id: domainId },
      include: {
        users: true,
        events: true,
      },
    });

    if (!domain) {
      return NextResponse.json(
        { message: "Domain not found" },
        { status: 404 }
      );
    }

    // Check if domain has users or events
    if (domain.users.length > 0) {
      return NextResponse.json(
        {
          message:
            "Cannot delete domain with existing users. Please reassign or remove users first.",
        },
        { status: 400 }
      );
    }

    if (domain.events.length > 0) {
      return NextResponse.json(
        {
          message:
            "Cannot delete domain with existing events. Please delete events first.",
        },
        { status: 400 }
      );
    }

    await prisma.domain.delete({
      where: { id: domainId },
    });

    return NextResponse.json(
      { message: "Domain deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error deleting domain", error);
    return NextResponse.json(
      { message: "Failed to delete domain" },
      { status: 500 }
    );
  }
}
