import { getCurrentUser } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import {
  markAttendanceSchema,
  bulkMarkAttendanceSchema,
} from "@/lib/validators/attendance.schema";
import { NextResponse } from "next/server";

// Mark attendance (single or bulk)
export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Check if it's bulk or single
    if (body.attendances && Array.isArray(body.attendances)) {
      // Bulk marking
      const parsedBody = bulkMarkAttendanceSchema.safeParse(body);
      if (!parsedBody.success) {
        return NextResponse.json(
          { message: "Invalid request data", errors: parsedBody.error.errors },
          { status: 400 }
        );
      }

      const { eventId, attendances } = parsedBody.data;

      // Verify event exists
      const event = await prisma.event.findUnique({
        where: { id: eventId },
      });

      if (!event) {
        return NextResponse.json(
          { message: "Event not found" },
          { status: 404 }
        );
      }

      if (event.status === "CLOSED") {
        return NextResponse.json(
          { message: "Cannot mark attendance for a closed event" },
          { status: 400 }
        );
      }

      // Bulk upsert attendance records
      const results = await Promise.all(
        attendances.map((attendance) =>
          prisma.attendance.upsert({
            where: {
              eventId_userId: {
                eventId: eventId,
                userId: attendance.userId,
              },
            },
            update: {
              status: attendance.status,
              markedById: user.id,
            },
            create: {
              eventId: eventId,
              userId: attendance.userId,
              status: attendance.status,
              markedById: user.id,
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  roll: true,
                },
              },
            },
          })
        )
      );

      return NextResponse.json(
        {
          message: "Attendance marked successfully",
          attendances: results,
        },
        { status: 201 }
      );
    } else {
      // Single marking
      const parsedBody = markAttendanceSchema.safeParse(body);
      if (!parsedBody.success) {
        return NextResponse.json(
          { message: "Invalid request data", errors: parsedBody.error.errors },
          { status: 400 }
        );
      }

      const { eventId, userId, status } = parsedBody.data;

      // Verify event exists
      const event = await prisma.event.findUnique({
        where: { id: eventId },
      });

      if (!event) {
        return NextResponse.json(
          { message: "Event not found" },
          { status: 404 }
        );
      }

      if (event.status === "CLOSED") {
        return NextResponse.json(
          { message: "Cannot mark attendance for a closed event" },
          { status: 400 }
        );
      }

      // Verify user exists
      const userExists = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!userExists) {
        return NextResponse.json(
          { message: "User not found" },
          { status: 404 }
        );
      }

      const attendance = await prisma.attendance.upsert({
        where: {
          eventId_userId: {
            eventId: eventId,
            userId: userId,
          },
        },
        update: {
          status: status,
          markedById: user.id,
        },
        create: {
          eventId: eventId,
          userId: userId,
          status: status,
          markedById: user.id,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              roll: true,
            },
          },
          event: {
            select: {
              id: true,
              title: true,
              date: true,
            },
          },
        },
      });

      return NextResponse.json(
        { message: "Attendance marked successfully", attendance },
        { status: 201 }
      );
    }
  } catch (error) {
    console.log("Error marking attendance", error);
    return NextResponse.json(
      { message: "Failed to mark attendance" },
      { status: 500 }
    );
  }
}

// Get attendance records
export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");

    let where = {};

    // Role-based filtering
    if (user.role === "USER") {
      // Regular users can only see their own attendance
      where.userId = user.id;
    } else if (user.role === "ADMIN") {
      // Admins can see attendance for their domain
      where.event = {
        domainId: user.domainId,
      };
    }
    // SUPER_ADMIN can see all

    // Apply filters
    if (eventId) {
      where.eventId = eventId;
    }
    if (userId && ["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      where.userId = userId;
    }
    if (status) {
      where.status = status;
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            roll: true,
            role: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            date: true,
            status: true,
            domain: true,
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
        createdAt: "desc",
      },
    });

    return NextResponse.json({ attendances }, { status: 200 });
  } catch (error) {
    console.log("Error fetching attendance", error);
    return NextResponse.json(
      { message: "Failed to fetch attendance" },
      { status: 500 }
    );
  }
}
