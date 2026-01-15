import { z } from "zod";

export const CreateBudgetSchema = z.object({
  category: z.string().min(1, "Category is required"),
  categoryIcon: z.string().min(1, "Category icon is required"),
  amount: z.number().positive("Amount must be positive"),
  month: z.number().min(0).max(11),
  year: z.number().min(2000),
});

export type CreateBudgetSchemaType = z.infer<typeof CreateBudgetSchema>;
