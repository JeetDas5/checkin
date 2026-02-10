import { getCurrentUser } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { updateUserSchema } from "@/lib/validators/user.schema";
import { NextResponse } from "next/server";

// Get specific user
export async function GET(request, { params }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
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
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Check permissions
    if (currentUser.role === "USER" && user.id !== currentUser.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (
      currentUser.role === "ADMIN" &&
      user.domainId !== currentUser.domainId &&
      user.id !== currentUser.id
    ) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.log("Error fetching user", error);
    return NextResponse.json(
      { message: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

// Update user
export async function PATCH(request, { params }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Permission checks
    const isSelf = userId === currentUser.id;
    const isSuperAdmin = currentUser.role === "SUPER_ADMIN";
    const isAdmin = currentUser.role === "ADMIN";

    // Only SUPER_ADMIN can update other users' roles
    // ADMIN can update users in their domain (except role)
    // Users can only update their own profile (except role and domainId)

    if (!isSelf && !isSuperAdmin && !isAdmin) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (isAdmin && existingUser.domainId !== currentUser.domainId && !isSelf) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsedBody = updateUserSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { message: "Invalid request data", errors: parsedBody.error.errors },
        { status: 400 }
      );
    }

    const data = parsedBody.data;

    // Restrict what can be updated based on role
    if (!isSuperAdmin) {
      delete data.role; // Only SUPER_ADMIN can change roles
    } else {
      // If SUPER_ADMIN updates role to SUPER_ADMIN, ensure domainId is null
      if (data.role === "SUPER_ADMIN") {
        data.domainId = null;
      }
    }

    if (!isSuperAdmin && !isAdmin) {
      delete data.domainId; // Only SUPER_ADMIN and ADMIN can change domains
    }

    // Ensure SUPER_ADMIN always has null domainId
    const effectiveRole = data.role || existingUser.role;
    if (effectiveRole === "SUPER_ADMIN") {
      data.domainId = null;
    }

    // Check for unique constraints
    if (data.email && data.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (emailExists) {
        return NextResponse.json(
          { message: "Email already in use" },
          { status: 409 }
        );
      }
    }

    if (data.roll && data.roll !== existingUser.roll) {
      const rollExists = await prisma.user.findUnique({
        where: { roll: data.roll },
      });
      if (rollExists) {
        return NextResponse.json(
          { message: "Roll number already in use" },
          { status: 409 }
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.email && { email: data.email }),
        ...(data.roll && { roll: data.roll }),
        ...(data.role && { role: data.role }),
        ...(data.domainId !== undefined && { domainId: data.domainId }),
        ...(data.profile_pic !== undefined && {
          profile_pic: data.profile_pic,
        }),
      },
      select: {
        id: true,
        name: true,
        email: true,
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
    });

    return NextResponse.json(
      { message: "User updated successfully", user: updatedUser },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error updating user", error);
    return NextResponse.json(
      { message: "Failed to update user" },
      { status: 500 }
    );
  }
}

// Delete user (SUPER_ADMIN only)
export async function DELETE(request, { params }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (currentUser.role !== "SUPER_ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { userId } = await params;

    // Prevent deleting yourself
    if (userId === currentUser.id) {
      return NextResponse.json(
        { message: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error deleting user", error);
    return NextResponse.json(
      { message: "Failed to delete user" },
      { status: 500 }
    );
  }
}
