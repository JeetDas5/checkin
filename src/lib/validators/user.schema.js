import { z } from "zod";

export const signUpSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  roll: z.string().min(2, "Roll must be at least 2 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "USER"]).optional(),
  domainId: z.string().nullable().optional(),
});

export const signInSchema = z.object({
  email: z.email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
