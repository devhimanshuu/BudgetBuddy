import { GetFormatterForCurrency } from "@/lib/helper";
import prisma from "@/lib/prisma";
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

	const queryParams = OverviewQuerySchema.safeParse({
		from,
		to,
	});

	if (!queryParams.success) {
		return Response.json(queryParams.error.message, {
			status: 400,
		});
	}

	const transaction = await getTransactionHistory(
		user.id,
		workspaceId || undefined,
		queryParams.data.from,
		queryParams.data.to,
	);
	return Response.json(transaction);
}

export type getTransactionHistoryResponseType = Awaited<
	ReturnType<typeof getTransactionHistory>
>;

async function getTransactionHistory(
	userId: string,
	workspaceId: string | undefined,
	from: Date,
	to: Date,
) {
	const [userSettings, transactions] = await Promise.all([
		prisma.userSettings.findUnique({
			where: {
				userId,
			},
		}),
		prisma.transaction.findMany({
			where: {
				...(workspaceId ? { workspaceId } : { userId }),
				date: {
					gte: from,
					lte: to,
				},
			},
			orderBy: {
				date: "desc",
			},
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
		}),
	]);

	if (!userSettings) {
		throw new Error("user settings not found");
	}

	const formatter = GetFormatterForCurrency(userSettings.currency);
	return transactions.map((transaction) => ({
		...transaction,
		formattedAmount: formatter.format(transaction.amount),
	}));
}
