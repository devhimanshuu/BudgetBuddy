import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
	console.log("Starting migration to workspaces...");

	// 1. Get all unique users across different models
	const userSettings = await prisma.userSettings.findMany();
	const userIds = userSettings.map((s) => s.userId);

	console.log(`Found ${userIds.length} users in UserSettings.`);

	for (const userId of userIds) {
		console.log(`Processing user: ${userId}`);

		// Fetch currency for the user
		const settings = await prisma.userSettings.findUnique({
			where: { userId },
		});
		const currency = settings?.currency || "USD";

		// 2. Create default workspace if it doesn't exist
		// We check if the user already has a workspace where they are the owner
		let workspace = await prisma.workspace.findFirst({
			where: { ownerId: userId, name: "Personal Workspace" },
		});

		if (!workspace) {
			workspace = await prisma.workspace.create({
				data: {
					name: "Personal Workspace",
					ownerId: userId,
					currency: currency,
					members: {
						create: {
							userId: userId,
							role: "ADMIN",
						},
					},
				},
			});
			console.log(`Created new workspace for user ${userId}: ${workspace.id}`);
		} else {
			console.log(`User ${userId} already has workspace: ${workspace.id}`);
		}

		const workspaceId = workspace.id;

		// 3. Update all related models
		// Transactions
		const txUpdate = await prisma.transaction.updateMany({
			where: { userId, workspaceId: null },
			data: { workspaceId },
		});
		console.log(`Updated ${txUpdate.count} transactions.`);

		// Categories
		const catUpdate = await prisma.category.updateMany({
			where: { userId, workspaceId: null },
			data: { workspaceId },
		});
		console.log(`Updated ${catUpdate.count} categories.`);

		// Tags
		const tagUpdate = await prisma.tag.updateMany({
			where: { userId, workspaceId: null },
			data: { workspaceId },
		});
		console.log(`Updated ${tagUpdate.count} tags.`);

		// Budgets
		const budgetUpdate = await prisma.budget.updateMany({
			where: { userId, workspaceId: null },
			data: { workspaceId },
		});
		console.log(`Updated ${budgetUpdate.count} budgets.`);

		// Savings Goals
		const goalUpdate = await prisma.savingsGoal.updateMany({
			where: { userId, workspaceId: null },
			data: { workspaceId },
		});
		console.log(`Updated ${goalUpdate.count} savings goals.`);

		// Assets
		const assetUpdate = await prisma.asset.updateMany({
			where: { userId, workspaceId: null },
			data: { workspaceId },
		});
		console.log(`Updated ${assetUpdate.count} assets.`);

		// Recurring Transactions
		const recUpdate = await prisma.recurringTransaction.updateMany({
			where: { userId, workspaceId: null },
			data: { workspaceId },
		});
		console.log(`Updated ${recUpdate.count} recurring transactions.`);

		// Monthly History
		const monthlyUpdate = await prisma.monthlyHistory.updateMany({
			where: { userId, workspaceId: null },
			data: { workspaceId },
		});
		console.log(`Updated ${monthlyUpdate.count} monthly history records.`);

		// Year History
		const yearUpdate = await prisma.yearHistory.updateMany({
			where: { userId, workspaceId: null },
			data: { workspaceId },
		});
		console.log(`Updated ${yearUpdate.count} year history records.`);
	}

	console.log("Migration finished.");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
