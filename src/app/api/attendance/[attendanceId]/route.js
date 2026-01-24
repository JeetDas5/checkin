import { getCurrentUser } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { updateAttendanceSchema } from "@/lib/validators/attendance.schema";
import { NextResponse } from "next/server";

// Get specific attendance record
export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { attendanceId } = await params;

    const attendance = await prisma.attendance.findUnique({
      where: { id: attendanceId },
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
    });

    if (!attendance) {
      return NextResponse.json(
        { message: "Attendance record not found" },
        { status: 404 }
      );
    }

    // Check permissions
    if (user.role === "USER" && attendance.userId !== user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(attendance, { status: 200 });
  } catch (error) {
    console.log("Error fetching attendance record", error);
    return NextResponse.json(
      { message: "Failed to fetch attendance record" },
      { status: 500 }
    );
  }
}

// Update attendance status
export async function PATCH(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { attendanceId } = await params;

    const existingAttendance = await prisma.attendance.findUnique({
      where: { id: attendanceId },
      include: {
        event: true,
      },
    });

    if (!existingAttendance) {
      return NextResponse.json(
        { message: "Attendance record not found" },
        { status: 404 }
      );
    }

    if (existingAttendance.event.status === "CLOSED") {
      return NextResponse.json(
        { message: "Cannot update attendance for a closed event" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsedBody = updateAttendanceSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { message: "Invalid request data", errors: parsedBody.error.errors },
        { status: 400 }
      );
    }

    const { status } = parsedBody.data;

    const attendance = await prisma.attendance.update({
      where: { id: attendanceId },
      data: {
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
      { message: "Attendance updated successfully", attendance },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error updating attendance", error);
    return NextResponse.json(
      { message: "Failed to update attendance" },
      { status: 500 }
    );
  }
}

// Delete attendance record
export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { attendanceId } = await params;

    const existingAttendance = await prisma.attendance.findUnique({
      where: { id: attendanceId },
      include: {
        event: true,
      },
    });

    if (!existingAttendance) {
      return NextResponse.json(
        { message: "Attendance record not found" },
        { status: 404 }
      );
    }

    if (existingAttendance.event.status === "CLOSED") {
      return NextResponse.json(
        { message: "Cannot delete attendance for a closed event" },
        { status: 400 }
      );
    }

    await prisma.attendance.delete({
      where: { id: attendanceId },
    });

    return NextResponse.json(
      { message: "Attendance record deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error deleting attendance", error);
    return NextResponse.json(
      { message: "Failed to delete attendance record" },
      { status: 500 }
    );
  }
}
