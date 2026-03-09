import prisma from "@/lib/prisma";
import { TransactionType } from "@/lib/type";
import { OverviewQuerySchema } from "@/schema/overview";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getActiveWorkspace } from "@/lib/workspaces";

export async function GET(request: Request) {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	const workspace = await getActiveWorkspace();
	const workspaceId = workspace?.id;

	const { searchParams } = new URL(request.url);
	const from = searchParams.get("from");
	const to = searchParams.get("to");

	const queryParams = OverviewQuerySchema.safeParse({ from, to });
	if (!queryParams.success) {
		return Response.json(
			{ error: queryParams.error.message },
			{
				status: 400,
			},
		);
	}

	const stats = await getCategoriesStats(
		user.id,
		workspaceId || undefined,
		queryParams.data.from,
		queryParams.data.to,
	);
	return Response.json(stats);
}

export type GetCategoriesStatsResponseType = Array<{
	type: TransactionType;
	_sum: { amount: number | null };
	category: string;
	categoryIcon: string;
}>;

async function getCategoriesStats(
	userId: string,
	workspaceId: string | undefined,
	from: Date,
	to: Date,
) {
	const stats = await prisma.transaction.groupBy({
		by: ["type", "category", "categoryIcon"],
		where: {
			userId,
			...(workspaceId && { workspaceId }),
			date: {
				gte: from,
				lte: to,
			},
		},
		_sum: {
			amount: true,
		},
		orderBy: {
			_sum: {
				amount: "desc",
			},
		},
	});

	return stats.map((stat) => ({
		...stat,
		_sum: {
			amount: stat._sum.amount ?? 0,
		},
	}));
}
