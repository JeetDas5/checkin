import { prisma } from "../prisma";

export async function getUser(req) {
  const userId = req.headeres.get("x-user-id");
  if (!userId) {
    return null;
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    return null;
  }

  return user;
}
