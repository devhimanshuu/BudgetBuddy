import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { GetFormatterForCurrency } from "@/lib/helper";
import { getActiveWorkspace, getMemberRestrictions } from "@/lib/workspaces";

export async function GET(request: Request) {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	const workspace = await getActiveWorkspace();
	const workspaceId = workspace?.id;

	const { searchParams } = new URL(request.url);
	const query = searchParams.get("query");
	const tags = searchParams.get("tags");
	const category = searchParams.get("category");
	const type = searchParams.get("type");
	const minAmount = searchParams.get("minAmount");
	const maxAmount = searchParams.get("maxAmount");
	const from = searchParams.get("from");
	const to = searchParams.get("to");

	const page = parseInt(searchParams.get("page") || "1");
	const pageSize = parseInt(searchParams.get("pageSize") || "100");
	const skip = (page - 1) * pageSize;
	const take = pageSize;

	const restrictions = workspaceId ? await getMemberRestrictions(user.id, workspaceId) : null;

	// Build where clause
	const where: any = {
		...(workspaceId ? { workspaceId } : { userId: user.id }),
		deletedAt: null,
		...(restrictions?.allowedCategories ? { category: { in: restrictions.allowedCategories } } : {}),
	};

	// Filter by tags if specified
	if (tags) {
		const tagIds = tags.split(",");
		where.tags = {
			every: {
				tagId: { in: tagIds },
			},
		};
	}

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
	if (type && (type === "income" || type === "expense" || type === "investment")) {
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

	// Get transactions and total count
	const [transactions, totalCount] = await Promise.all([
		prisma.transaction.findMany({
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
			skip,
			take,
		}),
		prisma.transaction.count({ where }),
	]);

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
		pagination: {
			page,
			pageSize,
			totalCount,
			totalPages: Math.ceil(totalCount / pageSize),
		},
	});
}

