"use server";

import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { UpdateAlertSettingsSchema } from "@/schema/UserSettings";

export async function GetUserSettings() {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	let userSettings = await prisma.userSettings.findUnique({
		where: {
			userId: user.id,
		},
	});

	if (!userSettings) {
		userSettings = await prisma.userSettings.create({
			data: {
				userId: user.id,
				currency: "INR",
			},
		});
	}

	return userSettings;
}

export async function UpdateAlertSettings(data: {
	spendingLimitThreshold: number;
	enableAnomalyDetection: boolean;
	anomalyThreshold: number;
}) {
	const parsed = UpdateAlertSettingsSchema.safeParse(data);
	if (!parsed.success) {
		throw new Error("Invalid settings data");
	}

	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	return await prisma.userSettings.upsert({
		where: {
			userId: user.id,
		},
		update: {
			...parsed.data,
		},
		create: {
			userId: user.id,
			currency: "INR",
			...parsed.data,
		},
	});
}

export async function UpdateActiveTheme(theme: string) {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	return await prisma.userSettings.upsert({
		where: {
			userId: user.id,
		},
		update: {
			activeTheme: theme,
		},
		create: {
			userId: user.id,
			currency: "INR",
			activeTheme: theme,
		},
	});
}
