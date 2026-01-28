import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { GetFormatterForCurrency } from "@/lib/helper";

export async function GET(request: Request) {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	const { searchParams } = new URL(request.url);
	const query = searchParams.get("query");
	const tags = searchParams.get("tags");
	const category = searchParams.get("category");
	const type = searchParams.get("type");
	const minAmount = searchParams.get("minAmount");
	const maxAmount = searchParams.get("maxAmount");
	const from = searchParams.get("from");
	const to = searchParams.get("to");

	// Build where clause
	const where: any = {
		userId: user.id,
	};

	// Full-text search across description and notes
	if (query) {
		where.OR = [
			{
				description: {
					contains: query,
					mode: "insensitive",
				},
			},
			{
				notes: {
					contains: query,
					mode: "insensitive",
				},
			},
		];
	}

	// Filter by category
	if (category) {
		where.category = category;
	}

	// Filter by type
	if (type && (type === "income" || type === "expense")) {
		where.type = type;
	}

	// Filter by amount range
	if (minAmount || maxAmount) {
		where.amount = {};
		if (minAmount) {
			where.amount.gte = parseFloat(minAmount);
		}
		if (maxAmount) {
			where.amount.lte = parseFloat(maxAmount);
		}
	}

	// Filter by date range
	if (from || to) {
		where.date = {};
		if (from) {
			where.date.gte = new Date(from);
		}
		if (to) {
			where.date.lte = new Date(to);
		}
	}

	// Get transactions
	let transactions = await prisma.transaction.findMany({
		where,
		include: {
			tags: {
				include: {
					tag: true,
				},
			},
			attachments: true,
			splits: true,
			_count: {
				select: {
					history: true,
				},
			},
		},
		orderBy: {
			date: "desc",
		},
		take: 100, // Limit results
	});

	// Filter by tags if specified
	if (tags) {
		const tagIds = tags.split(",");
		transactions = transactions.filter((transaction) =>
			tagIds.every((tagId) =>
				transaction.tags.some((tt) => tt.tagId === tagId),
			),
		);
	}

	// Get user settings for currency formatting
	const userSettings = await prisma.userSettings.findUnique({
		where: {
			userId: user.id,
		},
	});

	const formatter = userSettings
		? GetFormatterForCurrency(userSettings.currency)
		: new Intl.NumberFormat("en-US", {
				style: "currency",
				currency: "USD",
			});

	// Format transactions
	const formattedTransactions = transactions.map((transaction) => ({
		id: transaction.id,
		description: transaction.description,
		notes: transaction.notes,
		amount: transaction.amount,
		formattedAmount: formatter.format(transaction.amount),
		type: transaction.type,
		category: transaction.category,
		categoryIcon: transaction.categoryIcon,
		date: transaction.date,
		tags: transaction.tags.map((tt) => ({
			tag: {
				id: tt.tag.id,
				name: tt.tag.name,
				color: tt.tag.color,
			},
		})),
		attachments: transaction.attachments.map((att) => ({
			id: att.id,
			fileName: att.fileName,
			fileUrl: att.fileUrl,
			fileSize: att.fileSize,
			fileType: att.fileType,
		})),
		splits: transaction.splits.map((s) => ({
			id: s.id,
			category: s.category,
			categoryIcon: s.categoryIcon,
			amount: s.amount,
			percentage: s.percentage,
		})),
		_count: transaction._count,
	}));

	return Response.json({
		transactions: formattedTransactions,
		count: formattedTransactions.length,
	});
}
