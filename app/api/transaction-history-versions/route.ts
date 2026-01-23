import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { TransactionHistory } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	const { searchParams } = new URL(request.url);
	const transactionId = searchParams.get("transactionId");

	if (!transactionId) {
		return Response.json(
			{ error: "Transaction ID is required" },
			{ status: 400 },
		);
	}

	// Verify the transaction belongs to the user
	const transaction = await prisma.transaction.findUnique({
		where: {
			id: transactionId,
			userId: user.id,
		},
	});

	if (!transaction) {
		return Response.json({ error: "Transaction not found" }, { status: 404 });
	}

	// Fetch all history records for this transaction
	const history = await prisma.transactionHistory.findMany({
		where: {
			transactionId,
		},
		orderBy: {
			changedAt: "desc", // Most recent first
		},
	});

	return Response.json(history);
}

export type TransactionHistoryResponse = TransactionHistory[];
