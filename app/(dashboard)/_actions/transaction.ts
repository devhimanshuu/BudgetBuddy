"use server";

import prisma from "@/lib/prisma";
import {
	CreateTransactionSchema,
	CreateTransactionSchemaType,
} from "@/schema/transaction";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { updateStreak, checkAchievements } from "@/lib/gamification";

export async function CreateTransaction(form: CreateTransactionSchemaType) {
	const parsedBody = CreateTransactionSchema.safeParse(form);
	if (!parsedBody.success) {
		throw new Error(parsedBody.error.message);
	}

	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	const {
		amount,
		category,
		date,
		description,
		notes,
		type,
		tags,
		attachments,
		splits,
	} = parsedBody.data;
	const categoryRow = await prisma.category.findFirst({
		where: {
			userId: user.id,
			name: category,
		},
	});
	if (!categoryRow) {
		throw new Error("category not found");
	}

	//NOTE: dont make confusion between transaction (prisma) and prisma.transaction (table)

	await prisma.$transaction(async (tx) => {
		//create user transaction
		const transaction = await tx.transaction.create({
			data: {
				userId: user.id,
				amount,
				date,
				description: description || "",
				notes: notes || null,
				type,
				category: categoryRow.name,
				categoryIcon: categoryRow.icon,
			},
		});

		// Create tag associations if tags provided
		if (tags && tags.length > 0) {
			await tx.transactionTag.createMany({
				data: tags.map((tagId) => ({
					transactionId: transaction.id,
					tagId,
				})),
			});
		}

		// Create attachments if provided
		if (attachments && attachments.length > 0) {
			await tx.attachment.createMany({
				data: attachments.map((att) => ({
					transactionId: transaction.id,
					fileName: att.fileName,
					fileUrl: att.fileUrl,
					fileSize: att.fileSize,
					fileType: att.fileType,
				})),
			});
		}

		// Create splits if provided
		if (splits && splits.length > 0) {
			await tx.transactionSplit.createMany({
				data: splits.map((split) => ({
					transactionId: transaction.id,
					category: split.category,
					categoryIcon: split.categoryIcon,
					amount: split.amount,
					percentage: split.percentage,
				})),
			});
		}

		//Update aggregates table
		await tx.monthlyHistory.upsert({
			where: {
				day_month_year_userId: {
					userId: user.id,
					day: date.getUTCDate(),
					month: date.getUTCMonth(),
					year: date.getUTCFullYear(),
				},
			},
			create: {
				userId: user.id,
				day: date.getUTCDate(),
				month: date.getUTCMonth(),
				year: date.getUTCFullYear(),
				expense: type === "expense" ? amount : 0,
				income: type === "income" ? amount : 0,
			},
			update: {
				expense: {
					increment: type === "expense" ? amount : 0,
				},
				income: {
					increment: type === "income" ? amount : 0,
				},
			},
		});

		//update year Aggregate
		await tx.yearHistory.upsert({
			where: {
				month_year_userId: {
					userId: user.id,
					month: date.getUTCMonth(),
					year: date.getUTCFullYear(),
				},
			},
			create: {
				userId: user.id,
				month: date.getUTCMonth(),
				year: date.getUTCFullYear(),
				expense: type === "expense" ? amount : 0,
				income: type === "income" ? amount : 0,
			},
			update: {
				expense: {
					increment: type === "expense" ? amount : 0,
				},
				income: {
					increment: type === "income" ? amount : 0,
				},
			},
		});
	});

	// Update gamification (streaks and achievements)
	let unlockedAchievements: any[] = [];
	try {
		await updateStreak(user.id);
		const tAchievements = await checkAchievements(user.id, {
			type: "transaction",
		});
		const sAchievements = await checkAchievements(user.id, { type: "streak" });
		const bAchievements = await checkAchievements(user.id, { type: "budget" });
		unlockedAchievements = [
			...tAchievements,
			...sAchievements,
			...bAchievements,
		];
	} catch (error) {
		// Don't fail transaction creation if gamification fails
		console.error("Gamification error:", error);
	}

	return { success: true, unlockedAchievements };
}
