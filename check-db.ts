import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
	try {
		console.log("Connecting to database...");
		await prisma.$connect();
		console.log("Connected successfully.");

		const count = await prisma.category.count();
		console.log(`Found ${count} categories.`);

		// Try to find a user to simulate the action context (optional, just checking DB mostly)
		// const user = await prisma.user.findFirst(); // User model might not exist in prisma schema shown earlier?
		// The schema shown earlier has UserSettings, Category, Transaction, etc. but no User model.
		// This suggests User is managed by Clerk and referenced by userId string.
	} catch (e) {
		console.error("Database error:", e);
	} finally {
		await prisma.$disconnect();
	}
}

main();
