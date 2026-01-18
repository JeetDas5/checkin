import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Invalid email"),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "USER"]).optional(),
  domainId: z.string().optional().nullable(),
});
