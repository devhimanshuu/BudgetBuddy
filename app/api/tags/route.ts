import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getActiveWorkspace } from "@/lib/workspaces";

export async function GET(request: Request) {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	const workspace = await getActiveWorkspace();
	const workspaceId = workspace?.id;

	const tags = await prisma.tag.findMany({
		where: {
			...(workspaceId ? { workspaceId } : { userId: user.id }),
		},
		orderBy: {
			name: "asc",
		},
		include: {
			_count: {
				select: {
					transactions: true,
				},
			},
		},
	});

	return Response.json(tags);
}

export async function POST(request: Request) {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	const workspace = await getActiveWorkspace();
	if (!workspace) throw new Error("No active workspace");
	if (workspace.role === "VIEWER") {
		return Response.json({ error: "Forbidden" }, { status: 403 });
	}

	const body = await request.json();

	const bodySchema = z.object({
		name: z.string().min(1).max(50),
		color: z
			.string()
			.regex(/^#[0-9A-F]{6}$/i)
			.optional(),
	});

	const parsedBody = bodySchema.safeParse(body);

	if (!parsedBody.success) {
		return Response.json(parsedBody.error, { status: 400 });
	}

	const { name, color } = parsedBody.data;

	// Check if tag already exists in this workspace
	const existingTag = await prisma.tag.findFirst({
		where: {
			name,
			userId: user.id,
			workspaceId: workspace.id,
		},
	});

	if (existingTag) {
		return Response.json(
			{ error: "Tag with this name already exists" },
			{ status: 409 },
		);
	}

	const tag = await prisma.tag.create({
		data: {
			name,
			color: color || "#3b82f6",
			userId: user.id,
			workspaceId: workspace.id,
		},
	});

	return Response.json(tag, { status: 201 });
}

export async function DELETE(request: Request) {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	const workspace = await getActiveWorkspace();
	if (!workspace) throw new Error("No active workspace");
	if (workspace.role === "VIEWER") {
		return Response.json({ error: "Forbidden" }, { status: 403 });
	}

	const { searchParams } = new URL(request.url);
	const id = searchParams.get("id");

	if (!id) {
		return Response.json({ error: "Tag ID is required" }, { status: 400 });
	}

	// Verify ownership and workspace
	const tag = await prisma.tag.findUnique({
		where: { id },
	});

	if (!tag || tag.userId !== user.id) {
		return Response.json({ error: "Tag not found" }, { status: 404 });
	}

	await prisma.tag.update({
		where: { id },
		data: { deletedAt: new Date() },
	});

	return Response.json({ success: true });
}

