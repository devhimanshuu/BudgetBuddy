import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { differenceInMonths, addMonths, differenceInDays } from "date-fns";

export async function GET(request: Request) {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	// 1. Calculate average monthly savings (Income - Expense) over last 3 months
	const now = new Date();
	const history = await prisma.yearHistory.findMany({
		where: {
			userId: user.id,
			OR: [
				{
					year: now.getFullYear(),
					month: { lte: now.getMonth(), gte: now.getMonth() - 3 },
				},
				{
					year: now.getFullYear() - 1,
					month: { gte: 9 }, // Handle year transition
				},
			],
		},
		orderBy: [{ year: "desc" }, { month: "desc" }],
		take: 3,
	});

	const totalSavings = history.reduce(
		(sum, h) => sum + (h.income - h.expense),
		0,
	);
	const avgMonthlySavings =
		history.length > 0 ? totalSavings / history.length : 0;

	// 2. Fetch active savings goals
	const goals = await prisma.savingsGoal.findMany({
		where: {
			userId: user.id,
			isCompleted: false,
		},
		orderBy: {
			targetDate: "asc",
		},
	});

	// 3. Calculate impact for each goal
	const goalImpacts = goals.map((goal) => {
		const remainingAmount = goal.targetAmount - goal.currentAmount;

		// If no savings, it's impossible (null velocity)
		if (avgMonthlySavings <= 0) {
			return {
				...goal,
				estimatedMonths: null,
				estimatedDate: null,
				impactStatus: "impossible",
				delayInMonths: null,
			};
		}

		const estimatedMonths = remainingAmount / avgMonthlySavings;
		const estimatedDate = addMonths(new Date(), estimatedMonths);
		const targetDate = new Date(goal.targetDate);

		const delayInDays = differenceInDays(estimatedDate, targetDate);
		const delayInMonths = delayInDays / 30.44; // Average month length

		let impactStatus = "on-track";
		if (delayInMonths > 6) impactStatus = "critical-delay";
		else if (delayInMonths > 1) impactStatus = "delayed";
		else if (delayInMonths < -1) impactStatus = "ahead";

		return {
			...goal,
			estimatedMonths,
			estimatedDate,
			impactStatus,
			delayInMonths,
			avgMonthlySavings,
		};
	});

	return Response.json({
		avgMonthlySavings,
		goalImpacts,
	});
}
