import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AnalyticsContent from "./_components/AnalyticsContent";
import { getActiveWorkspace } from "@/lib/workspaces";

export default async function AnalyticsPage() {
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const [userSettings, workspace] = await Promise.all([
    prisma.userSettings.findUnique({
      where: {
        userId: user.id,
      },
    }),
    getActiveWorkspace()
  ]);

  if (!userSettings) {
    redirect("/wizard");
  }

  if (workspace?.currency) {
    userSettings.currency = workspace.currency;
  }

  return <AnalyticsContent userSettings={userSettings} />;
}
