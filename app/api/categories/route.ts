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

	const paramType = searchParams.get("type");

	const validator = z.enum(["expense", "income"]).nullable();
	const queryParams = validator.safeParse(paramType);
	if (!queryParams.success) {
		return Response.json(queryParams.error, {
			status: 400,
		});
	}

	const type = queryParams.data;
	const categories = await prisma.category.findMany({
		where: {
			userId: user.id,
			...(type && { type }), //include type in the filters if it's included
		},
		orderBy: {
			name: "asc",
		},
	});

	// Get transaction counts for all categories in one query using groupBy
	const transactionCounts = await prisma.transaction.groupBy({
		by: ["category", "type"],
		where: {
			userId: user.id,
			...(type && { type }),
		},
		_count: {
			_all: true,
		},
	});

	// Map counts to categories in memory
	const categoriesWithCounts = categories.map((category) => {
		const countObj = transactionCounts.find(
			(c) => c.category === category.name && c.type === category.type,
		);
		const count = countObj ? countObj._count._all : 0;

		return {
			...category,
			_count: {
				transactions: count,
			},
		};
	});

	return Response.json(categoriesWithCounts);
}
