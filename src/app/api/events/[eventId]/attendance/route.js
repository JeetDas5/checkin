import { getCurrentUser } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Get all attendance for a specific event
export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = await params;

    // Verify event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        domain: true,
      },
    });

    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    // Check permissions
    if (user.role === "ADMIN" && event.domainId !== user.domainId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const attendances = await prisma.attendance.findMany({
      where: { eventId: eventId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            roll: true,
            role: true,
            domainId: true,
          },
        },
        markedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        user: {
          name: "asc",
        },
      },
    });

    // Get attendance statistics
    const stats = {
      total: attendances.length,
      present: attendances.filter((a) => a.status === "PRESENT").length,
      absent: attendances.filter((a) => a.status === "ABSENT").length,
      excused: attendances.filter((a) => a.status === "EXCUSED").length,
      notApplicable: attendances.filter((a) => a.status === "NOT_APPLICABLE")
        .length,
    };

    return NextResponse.json(
      {
        event: {
          id: event.id,
          title: event.title,
          date: event.date,
          status: event.status,
          domain: event.domain,
        },
        attendances,
        stats,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error fetching event attendance", error);
    return NextResponse.json(
      { message: "Failed to fetch event attendance" },
      { status: 500 }
    );
  }
}
