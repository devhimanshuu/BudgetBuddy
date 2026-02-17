import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { z } from "zod";

export async function GET(request: Request) {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	const { searchParams } = new URL(request.url);
	const from = searchParams.get("from");
	const to = searchParams.get("to");

	const querySchema = z.object({
		from: z.string(),
		to: z.string(),
	});

	const queryParams = querySchema.safeParse({ from, to });

	if (!queryParams.success) {
		return Response.json(queryParams.error, { status: 400 });
	}

	const dateRange = {
		gte: new Date(queryParams.data.from),
		lte: new Date(queryParams.data.to),
	};

	// Get Income Breakdown
	const incomeCategories = await prisma.transaction.groupBy({
		by: ["category"],
		where: {
			userId: user.id,
			type: "income",
			date: dateRange,
		},
		_sum: {
			amount: true,
		},
	});

	// Get Expense Breakdown
	const expenseCategories = await prisma.transaction.groupBy({
		by: ["category"],
		where: {
			userId: user.id,
			type: "expense",
			date: dateRange,
		},
		_sum: {
			amount: true,
		},
	});

	const totalIncome = incomeCategories.reduce(
		(acc, curr) => acc + (curr._sum.amount || 0),
		0,
	);
	const totalExpense = expenseCategories.reduce(
		(acc, curr) => acc + (curr._sum.amount || 0),
		0,
	);

	const nodes: { name: string }[] = [];
	const links: { source: number; target: number; value: number }[] = [];

	// 1. Central node
	const ROOT_NODE_NAME = "Total Budget";
	nodes.push({ name: ROOT_NODE_NAME });
	const rootIdx = 0;

	// 2. Income Nodes & Links
	incomeCategories.forEach((inc) => {
		const nodeIdx = nodes.length;
		nodes.push({ name: inc.category });
		links.push({
			source: nodeIdx,
			target: rootIdx,
			value: inc._sum.amount || 0,
		});
	});

	// 3. Expense Nodes & Links
	expenseCategories.forEach((exp) => {
		const nodeIdx = nodes.length;
		nodes.push({ name: exp.category });
		links.push({
			source: rootIdx,
			target: nodeIdx,
			value: exp._sum.amount || 0,
		});
	});

	// 4. Savings / Surplus
	if (totalIncome > totalExpense) {
		const savingsIdx = nodes.length;
		nodes.push({ name: "Savings/Surplus" });
		links.push({
			source: rootIdx,
			target: savingsIdx,
			value: totalIncome - totalExpense,
		});
	}

	// If there's no data at all
	if (nodes.length === 1 && totalIncome === 0 && totalExpense === 0) {
		return Response.json({ nodes: [], links: [] });
	}

	return Response.json({ nodes, links });
}
