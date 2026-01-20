import { getUser } from "@/lib/auth/user";
import { prisma } from "@/lib/prisma";
import { createEventSchema } from "@/lib/validators/event.schema";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const currentUser = await getUser(request);
    if (!currentUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    //Check for user role
    if (!["ADMIN", "SUPER_ADMIN"].includes(currentUser.role)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    //Create event
    const body = await request.json();
    const parsedBody = createEventSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { message: "Invalid request data", errors: parsedBody.error.flatten() },
        { status: 400 }
      );
    }
    const { title, date, domainId } = parsedBody.data;

    if (
      currentUser.role === "ADMIN" &&
      domainId &&
      domainId !== currentUser.domainId
    ) {
      return NextResponse.json(
        { message: "Admins can only create events for their own domain" },
        { status: 403 }
      );
    }

    //Save event to db
    const event = await prisma.event.create({
      data: {
        title,
        date: new Date(date),
        domainId,
        createdById: currentUser.id,
      },
    });
    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.log("Error creating an event", error);
    return NextResponse.json(
      { message: "Error creating an event" },
      { status: 500 }
    );
  }
}
