import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { z } from "zod";

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	const { id } = await params;

	const body = await request.json();

	const bodySchema = z.object({
		name: z.string().min(1).max(50).optional(),
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

	// Verify tag exists and user owns it
	const existingTag = await prisma.tag.findUnique({
		where: { id },
	});

	if (!existingTag || existingTag.userId !== user.id) {
		return Response.json({ error: "Tag not found" }, { status: 404 });
	}

	// If name is being changed, check for duplicates
	if (name && name !== existingTag.name) {
		const duplicateTag = await prisma.tag.findUnique({
			where: {
				name_userId: {
					name,
					userId: user.id,
				},
			},
		});

		if (duplicateTag) {
			return Response.json(
				{ error: "Tag with this name already exists" },
				{ status: 409 },
			);
		}
	}

	// Update tag
	const updatedTag = await prisma.tag.update({
		where: { id },
		data: {
			...(name && { name }),
			...(color && { color }),
		},
	});

	return Response.json(updatedTag);
}
