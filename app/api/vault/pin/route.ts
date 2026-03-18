import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createHash } from "crypto";

/** Hash a PIN using SHA-256 with a user-scoped salt */
function hashPin(pin: string, userId: string): string {
	return createHash("sha256")
		.update(`${userId}:vault:${pin}`)
		.digest("hex");
}

/** GET — returns whether PIN is enabled (never returns the hash) */
export async function GET() {
	const user = await currentUser();
	if (!user) redirect("/sign-in");

	const settings = await prisma.userSettings.findUnique({
		where: { userId: user.id },
		select: { vaultPinEnabled: true, vaultPin: true },
	});

	return Response.json({
		isEnabled: settings?.vaultPinEnabled ?? false,
		isSet: !!settings?.vaultPin,
	});
}

/** POST — set a new PIN (or update existing) */
export async function POST(request: Request) {
	const user = await currentUser();
	if (!user) redirect("/sign-in");

	const body = await request.json();
	const schema = z.object({
		pin: z
			.string()
			.min(4, "PIN must be at least 4 digits")
			.max(8, "PIN must be at most 8 digits")
			.regex(/^\d+$/, "PIN must contain only digits"),
	});

	const parsed = schema.safeParse(body);
	if (!parsed.success) {
		return Response.json(
			{ error: parsed.error.errors[0].message },
			{ status: 400 },
		);
	}

	const hashed = hashPin(parsed.data.pin, user.id);

	await prisma.userSettings.update({
		where: { userId: user.id },
		data: {
			vaultPin: hashed,
			vaultPinEnabled: true,
		},
	});

	return Response.json({ success: true });
}

/** PUT — verify a PIN attempt */
export async function PUT(request: Request) {
	const user = await currentUser();
	if (!user) redirect("/sign-in");

	const body = await request.json();
	const schema = z.object({
		pin: z.string().min(1),
	});

	const parsed = schema.safeParse(body);
	if (!parsed.success) {
		return Response.json({ error: "Invalid request" }, { status: 400 });
	}

	const settings = await prisma.userSettings.findUnique({
		where: { userId: user.id },
		select: { vaultPin: true, vaultPinEnabled: true },
	});

	if (!settings?.vaultPin || !settings.vaultPinEnabled) {
		// No PIN set — allow through
		return Response.json({ success: true, bypassed: true });
	}

	const hashed = hashPin(parsed.data.pin, user.id);
	const isCorrect = hashed === settings.vaultPin;

	if (!isCorrect) {
		return Response.json(
			{ error: "Incorrect PIN" },
			{ status: 401 },
		);
	}

	return Response.json({ success: true });
}

/** DELETE — remove / disable the PIN */
export async function DELETE() {
	const user = await currentUser();
	if (!user) redirect("/sign-in");

	await prisma.userSettings.update({
		where: { userId: user.id },
		data: {
			vaultPin: null,
			vaultPinEnabled: false,
		},
	});

	return Response.json({ success: true });
}
