import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getActiveWorkspace } from "@/lib/workspaces";

export async function GET(request: Request) {
	const user = await currentUser();
	if (!user) {
		return new NextResponse("Unauthorized", { status: 401 });
	}

	const workspace = await getActiveWorkspace();
	const workspaceId = workspace?.id;

	const transactions = await prisma.transaction.findMany({
		where: {
			...(workspaceId ? { workspaceId } : { userId: user.id }),
		},
		orderBy: { date: "desc" },
		take: 5,
	});

	return NextResponse.json(transactions);
}

