import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export async function POST(request: Request) {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	const { searchParams } = new URL(request.url);
	const target = searchParams.get("target"); // "categories" or "tags"

	if (target === "categories") {
		// 1. Get all categories for the user
		const categories = await prisma.category.findMany({
			where: { userId: user.id },
		});

		// 2. Identify categories with 0 transactions
		const unusedCategories = [];
		for (const category of categories) {
			const count = await prisma.transaction.count({
				where: {
					userId: user.id,
					category: category.name,
					type: category.type,
				},
			});
			if (count === 0) {
				unusedCategories.push({ name: category.name, type: category.type });
			}
		}

		if (unusedCategories.length === 0) {
			return Response.json({ message: "No unused categories found" });
		}

		// 3. Delete them
		const deleteCount = await prisma.category.deleteMany({
			where: {
				userId: user.id,
				OR: unusedCategories.map((c) => ({
					name: c.name,
					type: c.type,
				})),
			},
		});

		return Response.json({
			message: `Deleted ${deleteCount.count} unused categories`,
		});
	}

	if (target === "tags") {
		// 1. Get all tags for the user
		const tags = await prisma.tag.findMany({
			where: { userId: user.id },
			include: {
				_count: {
					select: { transactions: true },
				},
			},
		});

		// 2. Identify tags with 0 transactions
		const unusedTagIds = tags
			.filter((tag) => tag._count.transactions === 0)
			.map((tag) => tag.id);

		if (unusedTagIds.length === 0) {
			return Response.json({ message: "No unused tags found" });
		}

		// 3. Delete them
		await prisma.tag.deleteMany({
			where: {
				userId: user.id,
				id: { in: unusedTagIds },
			},
		});

		return Response.json({
			message: `Deleted ${unusedTagIds.length} unused tags`,
		});
	}

	return Response.json({ error: "Invalid target" }, { status: 400 });
}
