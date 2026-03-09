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

	const periods = await getHistoryPeriods(user.id, workspaceId);
	return Response.json(periods);
}

export type GetHistoryPeriodsResponseType = Awaited<
	ReturnType<typeof getHistoryPeriods>
>;

async function getHistoryPeriods(userId: string, workspaceId?: string) {
	const result = await prisma.monthlyHistory.findMany({
		where: {
			...(workspaceId ? { workspaceId } : { userId }),
		},
		select: {
			year: true,
		},
		distinct: ["year"],
		orderBy: [
			{
				year: "asc",
			},
		],
	});
	const years = result.map((el) => el.year);
	if (years.length === 0) {
		return [new Date().getFullYear()];
	}
	return years;
}
