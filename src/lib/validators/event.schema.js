import z from "zod";

export const createEventSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }),
  domainId: z.string().optional().nullable(),
});
