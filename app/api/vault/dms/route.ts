import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { z } from "zod";

/** GET — Retrieve current DMS settings and status */
export async function GET() {
	const user = await currentUser();
	if (!user) redirect("/sign-in");

	const settings = await prisma.userSettings.findUnique({
		where: { userId: user.id },
		select: {
			dmsEnabled: true,
			dmsThresholdDays: true,
			lastVaultActivity: true,
		},
	});

	if (!settings) return Response.json({ error: "Settings not found" }, { status: 404 });

	return Response.json(settings);
}

/** POST — Update DMS settings */
export async function POST(request: Request) {
	const user = await currentUser();
	if (!user) redirect("/sign-in");

	const body = await request.json();
	const schema = z.object({
		dmsEnabled: z.boolean(),
		dmsThresholdDays: z.number().min(1).max(365),
	});

	const parsed = schema.safeParse(body);
	if (!parsed.success) {
		return Response.json({ error: parsed.error.errors[0].message }, { status: 400 });
	}

	const updated = await prisma.userSettings.update({
		where: { userId: user.id },
		data: {
			dmsEnabled: parsed.data.dmsEnabled,
			dmsThresholdDays: parsed.data.dmsThresholdDays,
		},
	});

	return Response.json(updated);
}

/** PUT — "Ping" the switch (manual activity mark) */
export async function PUT() {
	const user = await currentUser();
	if (!user) redirect("/sign-in");

	const updated = await prisma.userSettings.update({
		where: { userId: user.id },
		data: {
			lastVaultActivity: new Date(),
		},
	});

	return Response.json({ success: true, lastActivity: updated.lastVaultActivity });
}
