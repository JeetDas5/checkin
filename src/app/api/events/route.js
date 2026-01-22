import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/auth";
import { createEventSchema } from "@/lib/validators/event.schema";

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
    const parsedBody = createEventSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { message: "Invalid request data", errors: parsedBody.error.errors },
        { status: 400 }
      );
    }
    const { title, date } = parsedBody.data;

    if (new Date(date) < new Date()) {
      return NextResponse.json(
        { message: "Event date must be in the future" },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        title,
        date,
        domainId: user.domainId || null,
        status: "OPEN",
        createdById: user.id,
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
        { message: "Event creation failed" },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { message: "Event created successfully", event },
      { status: 201 }
    );
  } catch (error) {
    console.log("Error creating an event");
    return NextResponse.json(
      { message: "Failed to create event" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const domainId = searchParams.get("domainId");
    const status = searchParams.get("status");
    const q = searchParams.get("q");

    let where = {};

    if (user.role === "SUPER_ADMIN") {
      where = {};
    } else if (user.role === "ADMIN") {
      where.domainId = user.domainId;
    } else {
      where = {
        OR: [{ domainId: user.domainId }, { domainId: null }],
      };
    }

    if (domainId) {
      where.domainId = domainId;
    }
    if (status) {
      where.status = status;
    }
    if (q) {
      where.title = {
        contains: q,
        mode: "insensitive",
      };
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: {
        date: "desc",
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
    return NextResponse.json({ events }, { status: 200 });
  } catch (error) {
    console.log("Error fetching events", error);
    return NextResponse.json(
      { message: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
