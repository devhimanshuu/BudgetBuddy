import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { z } from "zod";

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const body = await request.json();

  const bodySchema = z.object({
    transactionId: z.string(),
    fileName: z.string(),
    fileUrl: z.string(), // Base64 data URL or external URL
    fileSize: z.number(),
    fileType: z.string(),
  });

  const parsedBody = bodySchema.safeParse(body);

  if (!parsedBody.success) {
    return Response.json(parsedBody.error, { status: 400 });
  }

  const { transactionId, fileName, fileUrl, fileSize, fileType } =
    parsedBody.data;

  // Verify transaction ownership
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
  });

  if (!transaction || transaction.userId !== user.id) {
    return Response.json({ error: "Transaction not found" }, { status: 404 });
  }

  // Create attachment
  const attachment = await prisma.attachment.create({
    data: {
      transactionId,
      fileName,
      fileUrl,
      fileSize,
      fileType,
    },
  });

  return Response.json(attachment, { status: 201 });
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
      { error: "Attachment ID is required" },
      { status: 400 }
    );
  }

  // Verify ownership through transaction
  const attachment = await prisma.attachment.findUnique({
    where: { id },
    include: {
      transaction: true,
    },
  });

  if (!attachment || attachment.transaction.userId !== user.id) {
    return Response.json({ error: "Attachment not found" }, { status: 404 });
  }

  await prisma.attachment.delete({
    where: { id },
  });

  return Response.json({ success: true });
}
