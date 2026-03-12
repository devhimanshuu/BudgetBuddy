import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getActiveWorkspace } from "@/lib/workspaces";

export async function GET(request: Request) {
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
        currency: "USD",
      },
    });
  }

  const workspace = await getActiveWorkspace();
  if (workspace?.currency) {
    // Override with workspace currency for consistent client-side UI
    userSettings.currency = workspace.currency;
  }

  //Revalidate the home page that uses the user currency
  revalidatePath("/");
  return Response.json(userSettings);
}
