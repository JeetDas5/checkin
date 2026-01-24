import { z } from "zod";

export const markAttendanceSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  userId: z.string().min(1, "User ID is required"),
  status: z.enum(["PRESENT", "ABSENT", "EXCUSED", "NOT_APPLICABLE"]),
});

export const bulkMarkAttendanceSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  attendances: z.array(
    z.object({
      userId: z.string().min(1, "User ID is required"),
      status: z.enum(["PRESENT", "ABSENT", "EXCUSED", "NOT_APPLICABLE"]),
    })
  ),
});

export const updateAttendanceSchema = z.object({
  status: z.enum(["PRESENT", "ABSENT", "EXCUSED", "NOT_APPLICABLE"]),
});
