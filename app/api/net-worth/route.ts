import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	const { searchParams } = new URL(request.url);
	const period = searchParams.get("period") || "year"; // "month", "year", "all"

	try {
		// Calculate date range
		const now = new Date();
		let startDate = new Date();

		switch (period) {
			case "month":
				startDate.setMonth(now.getMonth() - 1);
				break;
			case "year":
				startDate.setFullYear(now.getFullYear() - 1);
				break;
			case "all":
				startDate = new Date(0); // Beginning of time
				break;
		}

		// Get all assets and liabilities
		const assets = await prisma.asset.findMany({
			where: {
				userId: user.id,
				type: "asset",
			},
			include: {
				history: {
					where: {
						date: {
							gte: startDate,
						},
					},
					orderBy: {
						date: "asc",
					},
				},
			},
		});

		const liabilities = await prisma.asset.findMany({
			where: {
				userId: user.id,
				type: "liability",
			},
			include: {
				history: {
					where: {
						date: {
							gte: startDate,
						},
					},
					orderBy: {
						date: "asc",
					},
				},
			},
		});

		// Get transaction history for cash flow
		const transactions = await prisma.transaction.findMany({
			where: {
				userId: user.id,
				date: {
					gte: startDate,
				},
			},
			orderBy: {
				date: "asc",
			},
		});

		// Calculate net worth over time
		const netWorthData: {
			date: string;
			assets: number;
			liabilities: number;
			cash: number;
			netWorth: number;
		}[] = [];

		// Group data by date
		const dateMap = new Map<string, any>();

		// Process asset history
		assets.forEach((asset) => {
			asset.history.forEach((entry) => {
				const dateKey = entry.date.toISOString().split("T")[0];
				if (!dateMap.has(dateKey)) {
					dateMap.set(dateKey, {
						date: dateKey,
						assets: 0,
						liabilities: 0,
						cash: 0,
					});
				}
				const data = dateMap.get(dateKey);
				data.assets += entry.value;
			});
		});

		// Process liability history
		liabilities.forEach((liability) => {
			liability.history.forEach((entry) => {
				const dateKey = entry.date.toISOString().split("T")[0];
				if (!dateMap.has(dateKey)) {
					dateMap.set(dateKey, {
						date: dateKey,
						assets: 0,
						liabilities: 0,
						cash: 0,
					});
				}
				const data = dateMap.get(dateKey);
				data.liabilities += entry.value;
			});
		});

		// Calculate cumulative cash from transactions
		let cumulativeCash = 0;
		transactions.forEach((transaction) => {
			const dateKey = transaction.date.toISOString().split("T")[0];
			if (transaction.type === "income") {
				cumulativeCash += transaction.amount;
			} else {
				cumulativeCash -= transaction.amount;
			}

			if (!dateMap.has(dateKey)) {
				dateMap.set(dateKey, {
					date: dateKey,
					assets: 0,
					liabilities: 0,
					cash: cumulativeCash,
				});
			} else {
				const data = dateMap.get(dateKey);
				data.cash = cumulativeCash;
			}
		});

		// Convert to array and calculate net worth
		const sortedDates = Array.from(dateMap.keys()).sort();
		sortedDates.forEach((dateKey) => {
			const data = dateMap.get(dateKey);
			netWorthData.push({
				...data,
				netWorth: data.assets + data.cash - data.liabilities,
			});
		});

		// Calculate current totals
		const currentAssets = assets.reduce(
			(sum, asset) => sum + asset.currentValue,
			0,
		);
		const currentLiabilities = liabilities.reduce(
			(sum, liability) => sum + liability.currentValue,
			0,
		);
		const currentCash = cumulativeCash;
		const currentNetWorth = currentAssets + currentCash - currentLiabilities;

		return NextResponse.json({
			history: netWorthData,
			current: {
				assets: currentAssets,
				liabilities: currentLiabilities,
				cash: currentCash,
				netWorth: currentNetWorth,
			},
		});
	} catch (error) {
		console.error("Error fetching net worth:", error);
		return NextResponse.json(
			{ error: "Failed to fetch net worth data" },
			{ status: 500 },
		);
	}
}
