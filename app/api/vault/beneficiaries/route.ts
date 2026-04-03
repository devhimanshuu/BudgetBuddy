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

	const beneficiaries = await prisma.beneficiary.findMany({
		where: {
			...(workspaceId ? { workspaceId } : { userId: user.id }),
		},
		orderBy: [{ createdAt: "desc" }],
	});

	return Response.json(beneficiaries);
}

export async function POST(request: Request) {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	const workspace = await getActiveWorkspace();
	if (!workspace)
		return Response.json({ error: "No active workspace" }, { status: 400 });
	if (workspace.role === "VIEWER" || workspace.role === "EDITOR")
		return Response.json(
			{ error: "Only admins can add beneficiaries" },
			{ status: 403 },
		);

	const body = await request.json();

	const bodySchema = z.object({
		name: z.string().min(1).max(100),
		email: z.string().email(),
		relationship: z.enum([
			"spouse",
			"child",
			"parent",
			"sibling",
			"lawyer",
			"accountant",
			"other",
		]),
		phone: z.string().optional(),
		notes: z.string().optional(),
		accessLevel: z.enum(["full", "partial", "emergency-only"]).optional(),
	});

	const parsedBody = bodySchema.safeParse(body);

	if (!parsedBody.success) {
		return Response.json(parsedBody.error, { status: 400 });
	}

	const beneficiary = await prisma.beneficiary.create({
		data: {
			userId: user.id,
			workspaceId: workspace.id,
			name: parsedBody.data.name,
			email: parsedBody.data.email,
			relationship: parsedBody.data.relationship,
			phone: parsedBody.data.phone,
			notes: parsedBody.data.notes,
			accessLevel: parsedBody.data.accessLevel || "full",
		},
	});

	await logActivity({
		workspaceId: workspace.id,
		userId: user.id,
		type: "BENEFICIARY_ADDED",
		description: `Added beneficiary: ${parsedBody.data.name}`,
		metadata: { relationship: parsedBody.data.relationship },
	});

	return Response.json(beneficiary, { status: 201 });
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
			{ error: "Beneficiary ID is required" },
			{ status: 400 },
		);
	}

	const workspace = await getActiveWorkspace();
	const beneficiary = await prisma.beneficiary.findUnique({
		where: { id },
	});

	if (!beneficiary) {
		return Response.json({ error: "Beneficiary not found" }, { status: 404 });
	}

	const isOwner = beneficiary.userId === user.id;
	const isAdmin = workspace?.role === "ADMIN";

	if (!isAdmin && !isOwner) {
		return Response.json(
			{ error: "Unauthorized to delete" },
			{ status: 401 },
		);
	}

	await prisma.beneficiary.update({
		where: { id },
		data: { deletedAt: new Date() },
	});

	return Response.json({ success: true });
}
