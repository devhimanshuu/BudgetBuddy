"use server";

import prisma from "@/lib/prisma";
import {
	CreateCategorySchema,
	CreateCategorySchemaType,
	DeleteCategorySchema,
	DeleteCategorySchemaType,
	UpdateCategorySchema,
	UpdateCategorySchemaType,
} from "@/schema/categories";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
export async function CreateCategory(form: CreateCategorySchemaType) {
	const parsedBody = CreateCategorySchema.safeParse(form);
	if (!parsedBody.success) {
		throw new Error("bad request");
	}
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}
	const { name, icon, type } = parsedBody.data;
	try {
		return await prisma.category.upsert({
			where: {
				name_userId_type: {
					name,
					userId: user.id,
					type,
				},
			},
			update: {
				icon,
			},
			create: {
				userId: user.id,
				name,
				icon,
				type,
			},
		});
	} catch (error) {
		console.error("Error creating category:", error);
		throw error;
	}
}

export async function DeleteCategory(form: DeleteCategorySchemaType) {
	const parsedBody = DeleteCategorySchema.safeParse(form);
	if (!parsedBody.success) {
		throw new Error("bad request");
	}

	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	return await prisma.category.delete({
		where: {
			name_userId_type: {
				userId: user.id,
				name: parsedBody.data.name,
				type: parsedBody.data.type,
			},
		},
	});
}

export async function UpdateCategory(form: UpdateCategorySchemaType) {
	const parsedBody = UpdateCategorySchema.safeParse(form);
	if (!parsedBody.success) {
		throw new Error("bad request");
	}

	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	const { oldName, name, icon, type } = parsedBody.data;

	try {
		// Check if the new name already exists (and it's not the same category)
		if (oldName !== name) {
			const existingCategory = await prisma.category.findUnique({
				where: {
					name_userId_type: {
						name,
						userId: user.id,
						type,
					},
				},
			});

			if (existingCategory) {
				throw new Error("A category with this name already exists");
			}
		}

		// Delete the old category and create a new one with updated values
		// This is necessary because name is part of the unique constraint
		await prisma.$transaction(async (tx) => {
			// Get the old category to preserve any relationships if needed
			const oldCategory = await tx.category.findUnique({
				where: {
					name_userId_type: {
						name: oldName,
						userId: user.id,
						type,
					},
				},
			});

			if (!oldCategory) {
				throw new Error("Category not found");
			}

			// Update transactions to use the new category name
			if (oldName !== name) {
				await tx.transaction.updateMany({
					where: {
						userId: user.id,
						category: oldName,
						type,
					},
					data: {
						category: name,
					},
				});
			}

			// Delete the old category
			await tx.category.delete({
				where: {
					name_userId_type: {
						name: oldName,
						userId: user.id,
						type,
					},
				},
			});

			// Create the new category with updated values
			return await tx.category.create({
				data: {
					userId: user.id,
					name,
					icon,
					type,
				},
			});
		});

		return { success: true };
	} catch (error) {
		console.error("Error updating category:", error);
		throw error;
	}
}
