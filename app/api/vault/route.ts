import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getActiveWorkspace, logActivity } from "@/lib/workspaces";

export async function GET(request: Request) {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	const workspace = await getActiveWorkspace();
	const workspaceId = workspace?.id;

	const { searchParams } = new URL(request.url);
	const category = searchParams.get("category");

	const entries = await prisma.vaultEntry.findMany({
		where: {
			...(workspaceId ? { workspaceId } : { userId: user.id }),
			...(category && category !== "all" ? { category } : {}),
		},
		orderBy: [{ sensitivity: "desc" }, { updatedAt: "desc" }],
	});

	return Response.json(entries);
}

export async function POST(request: Request) {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	const workspace = await getActiveWorkspace();
	if (!workspace)
		return Response.json({ error: "No active workspace" }, { status: 400 });
	if (workspace.role === "VIEWER")
		return Response.json(
			{ error: "Viewers cannot create vault entries" },
			{ status: 403 },
		);

	const body = await request.json();

	const bodySchema = z.object({
		title: z.string().min(1).max(200),
		content: z.string().min(1),
		category: z.enum([
			"insurance",
			"legal",
			"crypto",
			"banking",
			"property",
			"medical",
			"other",
		]),
		icon: z.string().optional(),
		sensitivity: z.enum(["low", "medium", "high", "critical"]).optional(),
		notes: z.string().optional(),
	});

	const parsedBody = bodySchema.safeParse(body);

	if (!parsedBody.success) {
		return Response.json(parsedBody.error, { status: 400 });
	}

	const entry = await prisma.vaultEntry.create({
		data: {
			userId: user.id,
			workspaceId: workspace.id,
			title: parsedBody.data.title,
			content: parsedBody.data.content,
			category: parsedBody.data.category,
			icon: parsedBody.data.icon || "🔒",
			sensitivity: parsedBody.data.sensitivity || "high",
			notes: parsedBody.data.notes,
		},
	});

	await logActivity({
		workspaceId: workspace.id,
		userId: user.id,
		type: "VAULT_ENTRY_CREATED",
		description: `Added vault entry: ${parsedBody.data.title}`,
		metadata: { category: parsedBody.data.category },
	});

	return Response.json(entry, { status: 201 });
}

export async function PATCH(request: Request) {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	const body = await request.json();

	const bodySchema = z.object({
		id: z.string(),
		title: z.string().min(1).max(200).optional(),
		content: z.string().min(1).optional(),
		category: z
			.enum([
				"insurance",
				"legal",
				"crypto",
				"banking",
				"property",
				"medical",
				"other",
			])
			.optional(),
		icon: z.string().optional(),
		sensitivity: z.enum(["low", "medium", "high", "critical"]).optional(),
		notes: z.string().optional().nullable(),
		lastVerified: z.string().datetime().optional(),
	});

	const parsedBody = bodySchema.safeParse(body);

	if (!parsedBody.success) {
		return Response.json(parsedBody.error, { status: 400 });
	}

	// Verify ownership
	const entry = await prisma.vaultEntry.findUnique({
		where: { id: parsedBody.data.id },
	});

	if (!entry || entry.userId !== user.id) {
		return Response.json({ error: "Entry not found" }, { status: 404 });
	}

	const { id, ...updateData } = parsedBody.data;

	const updatedEntry = await prisma.vaultEntry.update({
		where: { id },
		data: {
			...updateData,
			...(updateData.lastVerified
				? { lastVerified: new Date(updateData.lastVerified) }
				: {}),
		},
	});

	return Response.json(updatedEntry);
}

export async function DELETE(request: Request) {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	const { searchParams } = new URL(request.url);
	const id = searchParams.get("id");

	if (!id) {
		return Response.json(
			{ error: "Entry ID is required" },
			{ status: 400 },
		);
	}

	// Verify ownership
	const entry = await prisma.vaultEntry.findUnique({
		where: { id },
	});

	if (!entry || entry.userId !== user.id) {
		return Response.json({ error: "Entry not found" }, { status: 404 });
	}

	await prisma.vaultEntry.delete({
		where: { id },
	});

	return Response.json({ success: true });
}
