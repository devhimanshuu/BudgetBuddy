import prisma from "@/lib/prisma";
import { currentUser, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getActiveWorkspace } from "@/lib/workspaces";

export async function GET(request: Request) {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	const workspace = await getActiveWorkspace();
	const workspaceId = workspace?.id;

	const { searchParams } = new URL(request.url);
	const page = parseInt(searchParams.get("page") || "1");
	const pageSize = parseInt(searchParams.get("pageSize") || "30");
	const skip = (page - 1) * pageSize;
	const take = pageSize;

	if (!workspaceId) {
		return Response.json({
			activities: [],
			pagination: {
				page,
				pageSize,
				totalCount: 0,
				totalPages: 0,
			},
		});
	}

	const where = {
		workspaceId,
		...(workspace.role !== "ADMIN" ? { 
			userId: { in: [user.id, workspace.ownerId] } 
		} : {}),
	};

	const [activities, totalCount] = await Promise.all([
		prisma.activity.findMany({
			where,
			orderBy: {
				createdAt: "desc",
			},
			skip,
			take,
		}),
		prisma.activity.count({ where }),
	]);

	// Enrich with Clerk data
	const client = await clerkClient();
	const userIds = Array.from(new Set(activities.map((a) => a.userId)));
	const clerkUsers = userIds.length > 0 
        ? await client.users.getUserList({ userId: userIds })
        : { data: [] };

	const enrichedActivities = activities.map((a) => {
		const clerkUser = clerkUsers.data.find((u) => u.id === a.userId);
		return {
			...a,
			user: {
				name: clerkUser
					? clerkUser.firstName
						? clerkUser.lastName
							? `${clerkUser.firstName} ${clerkUser.lastName}`
							: clerkUser.firstName
						: clerkUser.emailAddresses[0]?.emailAddress.split("@")[0]
					: "Unknown User",
				imageUrl: clerkUser?.imageUrl,
			},
		};
	});

	return Response.json({
		activities: enrichedActivities,
		currency: workspace.currency,
		pagination: {
			page,
			pageSize,
			totalCount,
			totalPages: Math.ceil(totalCount / pageSize),
		},
	});
}
