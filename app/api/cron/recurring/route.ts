import prisma from "@/lib/prisma";
import { processRecurringTransaction } from "@/lib/recurring-logic";
import { revalidatePath } from "next/cache";

export async function GET(request: Request) {
	try {
		const authHeader = request.headers.get("authorization");

		// Vercel Cron sends "Bearer <CRON_SECRET>"
		if (
			authHeader !== `Bearer ${process.env.CRON_SECRET}` &&
			process.env.NODE_ENV === "production"
		) {
			return Response.json({ error: "Unauthorized" }, { status: 401 });
		}

		const now = new Date();
		// Fetch all recurring transactions due across the system
		const dueTransactions = await prisma.recurringTransaction.findMany({
			where: {
				date: {
					lte: now,
				},
			},
			select: {
				id: true,
			},
		});

		if (dueTransactions.length === 0) {
			return Response.json({ processed: 0, message: "No due transactions" });
		}

		let processedCount = 0;
		const errors = [];

		// Process sequentially to manage load
		for (const { id } of dueTransactions) {
			try {
				await processRecurringTransaction(id);
				processedCount++;
			} catch (error) {
				console.error(`Failed to process recurring transaction ${id}:`, error);
				errors.push({
					id,
					error: error instanceof Error ? error.message : "Unknown error",
				});
			}
		}

		// Attempt to revalidate paths for active users (though this is tricky in global cron)
		// We can't revalidate user-specific paths easily without user context.
		// However, the next time they load the page, it will be fresh.

		return Response.json({
			processed: processedCount,
			total: dueTransactions.length,
			errors,
		});
	} catch (error) {
		console.error("Cron job failed:", error);
		return Response.json({ error: "Internal Server Error" }, { status: 500 });
	}
}
