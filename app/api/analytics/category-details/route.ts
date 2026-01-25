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
	const type = searchParams.get("type");
	const category = searchParams.get("category");
	const tags = searchParams.get("tags");

	const querySchema = z.object({
		from: z.string(),
		to: z.string(),
		type: z.enum(["income", "expense"]),
		category: z.string(),
	});

	const queryParams = querySchema.safeParse({ from, to, type, category });

	if (!queryParams.success) {
		return Response.json(queryParams.error, { status: 400 });
	}

	const tagIds = tags ? tags.split(",") : [];

	const transactions = await prisma.transaction.findMany({
		where: {
			userId: user.id,
			type: queryParams.data.type,
			category: queryParams.data.category,
			date: {
				gte: new Date(queryParams.data.from),
				lte: new Date(queryParams.data.to),
			},
			...(tagIds.length > 0 && {
				tags: {
					some: {
						tagId: {
							in: tagIds,
						},
					},
				},
			}),
		},
		orderBy: {
			amount: "desc",
		},
		take: 5,
		select: {
			id: true,
			description: true,
			amount: true,
			date: true,
			categoryIcon: true,
			notes: true,
		},
	});

	return Response.json(transactions);
}
