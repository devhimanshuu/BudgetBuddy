import { GetFormatterForCurrency } from "@/lib/helper";
import prisma from "@/lib/prisma";
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

    // 1. Auto-delete items older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    await prisma.transaction.deleteMany({
        where: {
            ...(workspaceId ? { workspaceId } : { userId: user.id }),
            deletedAt: {
                lte: thirtyDaysAgo
            }
        }
    });

	const [userSettings, transactions] = await Promise.all([
		prisma.userSettings.findUnique({
			where: {
				userId: user.id,
			},
		}),
		prisma.transaction.findMany({
			where: {
				...(workspaceId ? { workspaceId } : { userId: user.id }),
				deletedAt: { not: null },
			},
			orderBy: {
				deletedAt: "desc",
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
		return Response.json({ error: "user settings not found" }, { status: 404 });
	}

	const formatter = GetFormatterForCurrency(userSettings.currency);
	return Response.json(
		transactions.map((transaction) => ({
			...transaction,
			formattedAmount: formatter.format(transaction.amount),
		})),
	);
}
