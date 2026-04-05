import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
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
	const type = searchParams.get("type");

	try {
		const assets = await prisma.asset.findMany({
			where: {
				...(workspaceId ? { workspaceId } : { userId: user.id }),
				...(type && { type }),
			},
			orderBy: {
				createdAt: "desc",
			},
			include: {
				history: {
					orderBy: {
						date: "desc",
					},
					take: 1, // Get the latest history entry
				},
			},
		});

		return NextResponse.json(assets);
	} catch (error) {
		console.error("Error fetching assets:", error);
		return NextResponse.json(
			{ error: "Failed to fetch assets" },
			{ status: 500 },
		);
	}
}

const createAssetSchema = z.object({
	name: z.string().min(1, "Name is required"),
	description: z.string().optional(),
	type: z.enum(["asset", "liability"]),
	category: z.string().min(1, "Category is required"),
	currentValue: z.number().positive("Value must be positive"),
	icon: z.string().default("💰"),
	color: z.string().default("#3b82f6"),
	notes: z.string().optional(),
});

export async function POST(request: Request) {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	const workspace = await getActiveWorkspace();
	if (!workspace)
		return NextResponse.json({ error: "No active workspace" }, { status: 400 });
	if (workspace.role === "VIEWER")
		return NextResponse.json(
			{ error: "Viewers cannot create assets" },
			{ status: 403 },
		);

	try {
		const body = await request.json();
		const validatedData = createAssetSchema.parse(body);

		const asset = await prisma.asset.create({
			data: {
				userId: user.id,
				workspaceId: workspace.id,
				...validatedData,
			},
		});

		// Create initial history entry
		await prisma.assetHistory.create({
			data: {
				assetId: asset.id,
				value: validatedData.currentValue,
				date: new Date(),
				notes: "Initial value",
			},
		});

        const userName = user.firstName ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}` : user.emailAddresses[0].emailAddress.split("@")[0];
        await logActivity({
            workspaceId: workspace.id,
            userId: user.id,
            type: "ASSET_CREATED",
            description: `${userName} added ${validatedData.type}: ${validatedData.icon} ${validatedData.name}`,
            metadata: { userName, name: validatedData.name, type: validatedData.type, value: validatedData.currentValue }
        });

		return NextResponse.json(asset, { status: 201 });
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "Validation error", details: error.errors },
				{ status: 400 },
			);
		}
		console.error("Error creating asset:", error);
		return NextResponse.json(
			{ error: "Failed to create asset" },
			{ status: 500 },
		);
	}
}

