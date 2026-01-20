import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "../prisma";

const COOKIE_NAME = "society_session";

const checkSecret = () => {
  if (!process.env.JWT_SECRET) {
    return false;
  }
  return true;
};

export function signToken(payload) {
  if (checkSecret() === false) {
    throw new Error("JWT_SECRET is not defined");
  }
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token) {
  if (checkSecret() === false) {
    throw new Error("JWT_SECRET is not defined");
  }
  return jwt.verify(token, process.env.JWT_SECRET);
}

export async function setAuthCookie(token) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0, // Expire the cookie immediately
  });
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }
  try {
    const decoded = verifyToken(token);
    if (!decoded) {
      return null;
    }
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });
    if (!user) {
      return null;
    }
    return user;
  } catch (error) {
    console.log("Error in jwt", error);
    return null;
  }
}
