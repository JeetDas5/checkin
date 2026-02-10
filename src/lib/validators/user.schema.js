import { z } from "zod";

export const signUpSchema = z.object({
  name: z.string().min(2),
  email: z.email().refine((email) => email.endsWith("@kiit.ac.in"), {
    message: "Only @kiit.ac.in emails are allowed",
  }),
  personalEmail: z.email("Invalid personal email address"),
  roll: z.string().min(2, "Roll must be at least 2 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "USER"]).optional(),
  domainId: z.string().nullable().optional(),
});

export const signInSchema = z.object({
  email: z.email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.email().optional(),
  personalEmail: z.email().optional(),
  roll: z.string().min(2).optional(),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "USER"]).optional(),
  domainId: z.string().nullable().optional(),
  profile_pic: z.string().url().nullable().optional(),
});

export const assignDomainSchema = z.object({
  domainId: z.string().nullable(),
});

export const updateRoleSchema = z.object({
  role: z.enum(["SUPER_ADMIN", "ADMIN", "USER"]),
});
