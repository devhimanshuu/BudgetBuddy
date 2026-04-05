import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { logActivity } from "@/lib/workspaces";

const updateAssetSchema = z.object({
	name: z.string().min(1, "Name is required").optional(),
	description: z.string().optional(),
	category: z.string().min(1, "Category is required").optional(),
	currentValue: z.number().positive("Value must be positive").optional(),
	icon: z.string().optional(),
	color: z.string().optional(),
	notes: z.string().optional(),
});

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	const { id } = await params;

	try {
		const body = await request.json();
		const validatedData = updateAssetSchema.parse(body);

		// Check if asset belongs to user
		const existingAsset = await prisma.asset.findFirst({
			where: {
				id: id,
				userId: user.id,
			},
		});

		if (!existingAsset) {
			return NextResponse.json({ error: "Asset not found" }, { status: 404 });
		}

		const asset = await prisma.asset.update({
			where: { id: id },
			data: validatedData,
		});

        if (
            validatedData.currentValue &&
            validatedData.currentValue !== existingAsset.currentValue
        ) {
            await prisma.assetHistory.create({
                data: {
                    assetId: asset.id,
                    value: validatedData.currentValue,
                    date: new Date(),
                    notes: "Value updated",
                },
            });
        }

        const userName = user.firstName ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}` : user.emailAddresses[0].emailAddress.split("@")[0];
        if (existingAsset.workspaceId) {
            await logActivity({
                workspaceId: existingAsset.workspaceId,
                userId: user.id,
                type: "ASSET_UPDATED",
                description: `${userName} updated asset: ${existingAsset.name}`,
                metadata: { userName, name: existingAsset.name, type: existingAsset.type }
            });
        }

		return NextResponse.json(asset);
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "Validation error", details: error.errors },
				{ status: 400 },
			);
		}
		console.error("Error updating asset:", error);
		return NextResponse.json(
			{ error: "Failed to update asset" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	const { id } = await params;

	try {
		// Check if asset belongs to user
		const existingAsset = await prisma.asset.findFirst({
			where: {
				id: id,
				userId: user.id,
			},
		});

		if (!existingAsset) {
			return NextResponse.json({ error: "Asset not found" }, { status: 404 });
		}

		await prisma.asset.update({
			where: { id: id },
			data: { deletedAt: new Date() },
		});

        const userName = user.firstName ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}` : user.emailAddresses[0].emailAddress.split("@")[0];
        if (existingAsset.workspaceId) {
            await logActivity({
                workspaceId: existingAsset.workspaceId,
                userId: user.id,
                type: "ASSET_DELETED",
                description: `${userName} deleted asset: ${existingAsset.name}`,
                metadata: { userName, name: existingAsset.name, type: existingAsset.type }
            });
        }

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error deleting asset:", error);
		return NextResponse.json(
			{ error: "Failed to delete asset" },
			{ status: 500 },
		);
	}
}
