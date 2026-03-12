import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getActiveWorkspace } from "@/lib/workspaces";

export async function GET(request: Request) {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	const workspace = await getActiveWorkspace();
	const workspaceId = workspace?.id;

	if (!workspaceId) {
		return Response.json([]);
	}

	const activities = await prisma.activity.findMany({
		where: {
			workspaceId,
			...(workspace.role !== "ADMIN" ? { userId: user.id } : {}),
		},
		orderBy: {
			createdAt: "desc",
		},
		take: 10,
	});

	return Response.json({
		activities,
		currency: workspace.currency
	});
}
