import { z } from "zod";

export const CreateTransactionSchema = z.object({
  amount: z.coerce.number().positive().multipleOf(0.01),
  description: z.string().optional(),
  notes: z.string().optional(),
  date: z.coerce.date(),
  category: z.string(),
  type: z.union([z.literal("income"), z.literal("expense")]),
  tags: z.array(z.string()).optional(),
  attachments: z
    .array(
      z.object({
        fileName: z.string(),
        fileUrl: z.string(),
        fileSize: z.number(),
        fileType: z.string(),
      })
    )
    .optional(),
  splits: z
    .array(
      z.object({
        category: z.string(),
        categoryIcon: z.string(),
        amount: z.number().positive(),
        percentage: z.number(),
      })
    )
    .optional(),
});

export type CreateTransactionSchemaType = z.infer<
  typeof CreateTransactionSchema
>;
