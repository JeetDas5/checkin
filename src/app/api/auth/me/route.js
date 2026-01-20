import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  //exclude password from the user object
  const { password, ...userWithoutPassword } = user;
  return NextResponse.json({ user: userWithoutPassword }, { status: 200 });
}
