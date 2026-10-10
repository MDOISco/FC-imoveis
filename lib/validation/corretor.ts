import { z } from "zod";

export const brokerSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do corretor").max(120),
  phone: z.string().trim().max(30).nullable().optional(),
  creci: z.string().trim().max(40).nullable().optional(),
  email: z.string().trim().max(160).nullable().optional(),
});
