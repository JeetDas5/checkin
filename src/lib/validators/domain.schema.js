import { z } from "zod";

export const createDomainSchema = z.object({
  name: z.string().min(2, "Domain name must be at least 2 characters"),
});
