import { getGamificationStats } from "@/lib/gamification";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export async function GET(request: Request) {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	try {
		const stats = await getGamificationStats(user.id);
		return Response.json(stats);
	} catch (error) {
		console.error("Error fetching gamification stats:", error);
		return Response.json(
			{ error: "Failed to fetch gamification stats" },
			{ status: 500 },
		);
	}
}
