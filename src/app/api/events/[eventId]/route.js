import { getCurrentUser } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { updateEventSchema } from "@/lib/validators/event.schema";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = await params;

    if (!eventId) {
      return NextResponse.json(
        { message: "Event ID is required" },
        { status: 400 }
      );
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        domain: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            roll: true,
            role: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ event }, { status: 200 });
  } catch (error) {
    console.log("Error fetching the event");
    return NextResponse.json(
      { message: "Failed to fetch event" },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const { eventId } = await params;

    if (!eventId) {
      return NextResponse.json(
        { message: "Event ID is required" },
        { status: 400 }
      );
    }

    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!existingEvent) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    if (!["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (existingEvent.status === "CLOSED") {
      return NextResponse.json(
        { message: "Cannot update a closed event" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsedBody = updateEventSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { message: "Invalid request data", errors: parsedBody.error.errors },
        { status: 400 }
      );
    }

    const data = parsedBody.data;

    // Validate date is in the future if provided
    if (data.date && new Date(data.date) < new Date()) {
      return NextResponse.json(
        { message: "Event date must be in the future" },
        { status: 400 }
      );
    }

    // ADMIN users cannot change domainId
    if (user.role === "ADMIN") {
      delete data.domainId;
    }

    const event = await prisma.event.update({
      where: { id: eventId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.date && { date: new Date(data.date) }),
        ...(data.domainId !== undefined && { domainId: data.domainId }),
      },
      include: {
        domain: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            roll: true,
            role: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { message: "Event update failed" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Event updated successfully", event },
      { status: 200 }
    );
  } catch (error) {
    console.log("Failed to update the event", error);
    return NextResponse.json(
      {
        message: "Failed to update event",
      },
      { status: 500 }
    );
  }
}
