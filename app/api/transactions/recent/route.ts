import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	const user = await currentUser();
	if (!user) {
		return new NextResponse("Unauthorized", { status: 401 });
	}

	const transactions = await prisma.transaction.findMany({
		where: { userId: user.id },
		orderBy: { date: "desc" },
		take: 5,
	});

	return NextResponse.json(transactions);
}
