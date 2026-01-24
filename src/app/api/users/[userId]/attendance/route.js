import { getCurrentUser } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Get attendance statistics for a user
export async function GET(request, { params }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;

    // Permission check
    if (currentUser.role === "USER" && userId !== currentUser.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        roll: true,
        role: true,
        domainId: true,
        domain: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Check if admin is viewing user from different domain
    if (
      currentUser.role === "ADMIN" &&
      user.domainId !== currentUser.domainId
    ) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Get all attendance records for the user
    const attendances = await prisma.attendance.findMany({
      where: { userId: userId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            date: true,
            status: true,
            domain: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        event: {
          date: "desc",
        },
      },
    });

    // Calculate statistics
    const stats = {
      total: attendances.length,
      present: attendances.filter((a) => a.status === "PRESENT").length,
      absent: attendances.filter((a) => a.status === "ABSENT").length,
      excused: attendances.filter((a) => a.status === "EXCUSED").length,
      notApplicable: attendances.filter((a) => a.status === "NOT_APPLICABLE")
        .length,
    };

    // Calculate attendance percentage
    const applicableAttendances = attendances.filter(
      (a) => a.status !== "NOT_APPLICABLE"
    );
    const attendancePercentage =
      applicableAttendances.length > 0
        ? (stats.present / applicableAttendances.length) * 100
        : 0;

    return NextResponse.json(
      {
        user,
        attendances,
        stats,
        attendancePercentage: Math.round(attendancePercentage * 100) / 100,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error fetching user attendance stats", error);
    return NextResponse.json(
      { message: "Failed to fetch user attendance statistics" },
      { status: 500 }
    );
  }
}
