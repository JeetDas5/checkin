import { getCurrentUser } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Reopen a closed event
export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { eventId } = await params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    // Check if admin is trying to reopen event from another domain
    if (user.role === "ADMIN" && event.domainId !== user.domainId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (event.status === "OPEN") {
      return NextResponse.json(
        { message: "Event is already open" },
        { status: 400 }
      );
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: { status: "OPEN" },
      include: {
        domain: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(
      { message: "Event reopened successfully", event: updatedEvent },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error reopening event", error);
    return NextResponse.json(
      { message: "Failed to reopen event" },
      { status: 500 }
    );
  }
}
