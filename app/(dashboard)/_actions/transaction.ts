"use server";

import prisma from "@/lib/prisma";
import {
	CreateTransactionSchema,
	CreateTransactionSchemaType,
} from "@/schema/transaction";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { updateStreak, checkAchievements } from "@/lib/gamification";

import { getActiveWorkspace, logActivity } from "@/lib/workspaces";
import { GetFormatterForCurrency } from "@/lib/helper";

export async function CreateTransaction(form: CreateTransactionSchemaType) {
	const parsedBody = CreateTransactionSchema.safeParse(form);
	if (!parsedBody.success) {
		throw new Error(parsedBody.error.message);
	}

	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	const userName = user.firstName
		? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
		: user.emailAddresses[0].emailAddress.split("@")[0];

	const workspace = await getActiveWorkspace();
	if (!workspace) {
		throw new Error("No active workspace found");
	}

	// Check permissions
	if (workspace.role === "VIEWER") {
		throw new Error(
			"You do not have permission to add transactions to this workspace",
		);
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

	// Determine transaction status
	// Only Editors are subject to approval workflow
	let status = "APPROVED";
	const approvalThreshold = workspace.approvalThreshold || 0;
	
	if (workspace.role === "EDITOR" && amount > approvalThreshold) {
		status = "PENDING";
	}

	const categoryRow = await prisma.category.findFirst({
		where: {
			workspaceId: workspace.id,
			name: category,
		},
	});

	if (!categoryRow) {
		throw new Error("category not found in this workspace");
	}

	await prisma.$transaction(async (tx) => {
		//create workspace transaction
		const transaction = await tx.transaction.create({
			data: {
				userId: user.id,
				workspaceId: workspace.id,
				amount,
				date,
				description: description || "",
				notes: notes || null,
				type,
				category: categoryRow.name,
				categoryIcon: categoryRow.icon,
				status,
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

		// Update aggregates ONLY if approved
		if (status === "APPROVED") {
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
					workspaceId: workspace.id,
					day: date.getUTCDate(),
					month: date.getUTCMonth(),
					year: date.getUTCFullYear(),
					expense: type === "expense" ? amount : 0,
					income: type === "income" ? amount : 0,
					investment: type === "investment" ? amount : 0,
				},
				update: {
					workspaceId: workspace.id,
					expense: {
						increment: type === "expense" ? amount : 0,
					},
					income: {
						increment: type === "income" ? amount : 0,
					},
					investment: {
						increment: type === "investment" ? amount : 0,
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
					workspaceId: workspace.id,
					month: date.getUTCMonth(),
					year: date.getUTCFullYear(),
					expense: type === "expense" ? amount : 0,
					income: type === "income" ? amount : 0,
					investment: type === "investment" ? amount : 0,
				},
				update: {
					workspaceId: workspace.id,
					expense: {
						increment: type === "expense" ? amount : 0,
					},
					income: {
						increment: type === "income" ? amount : 0,
					},
					investment: {
						increment: type === "investment" ? amount : 0,
					},
				},
			});
		}
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
		console.error("Gamification error:", error);
	}

	const formatter = GetFormatterForCurrency(workspace.currency);
	const formattedAmount = formatter.format(amount);

	const activityType = status === "PENDING" ? "TRANSACTION_PENDING" : "TRANSACTION_CREATED";
	const activityDescription = status === "PENDING"
		? `${userName} added a ${type} transaction (PENDING APPROVAL): ${description || category} (${formattedAmount})`
		: `${userName} added a ${type} transaction: ${description || category} (${formattedAmount})`;

	// Log activity
	await logActivity({
		workspaceId: workspace.id,
		userId: user.id,
		type: activityType,
		description: activityDescription,
		metadata: {
			userName,
			amount,
			type,
			category,
			status,
		},
	});

	return { success: true, unlockedAchievements, status };
}
