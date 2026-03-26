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

	const now = new Date();
	const currentMonth = now.getMonth();
	const currentYear = now.getFullYear();

	// Get previous month
	const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
	const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

	// Get current and previous month stats in parallel
	const [currentStats, previousStats] = await Promise.all([
		prisma.monthlyHistory.findMany({
			where: {
				...(workspaceId ? { workspaceId } : { userId: user.id }),
				month: currentMonth,
				year: currentYear,
			},
		}),
		prisma.monthlyHistory.findMany({
			where: {
				...(workspaceId ? { workspaceId } : { userId: user.id }),
				month: previousMonth,
				year: previousYear,
			},
		}),
	]);

	const currentIncome = currentStats.reduce((sum, s) => sum + s.income, 0);
	const currentExpense = currentStats.reduce((sum, s) => sum + s.expense, 0);
	const currentInvestment = currentStats.reduce((sum, s) => sum + (s.investment || 0), 0);
	const previousIncome = previousStats.reduce((sum, s) => sum + s.income, 0);
	const previousExpense = previousStats.reduce((sum, s) => sum + s.expense, 0);
	const previousInvestment = previousStats.reduce((sum, s) => sum + (s.investment || 0), 0);

	const currentBalance = currentIncome - currentExpense - currentInvestment;
	const previousBalance = previousIncome - previousExpense - previousInvestment;

	return Response.json({
		income: currentIncome,
		expense: currentExpense,
		investment: currentInvestment,
		balance: currentBalance,
		previousBalance,
	});
}

