import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import CreateAssetDialog from "../_components/CreateAssetDialog";
import AssetList from "../_components/AssetList";
import NetWorthChart from "../_components/NetWorthChart";

export default async function AssetsPage() {
    const user = await currentUser();
    if (!user) {
        redirect("/sign-in");
    }

    const userSettings = await prisma.userSettings.findUnique({
        where: {
            userId: user.id,
        },
    });

    if (!userSettings) {
        redirect("/wizard");
    }

    return (
        <div className="container mx-auto space-y-6 p-6 4xl:space-y-10 4xl:p-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold 3xl:text-4xl 4xl:text-5xl">
                        Assets & Liabilities
                    </h1>
                    <p className="text-muted-foreground 4xl:text-lg">
                        Track your net worth by managing your assets and liabilities
                    </p>
                </div>
                <CreateAssetDialog />
            </div>

            {/* Net Worth Chart */}
            <NetWorthChart userSettings={userSettings} />

            {/* Assets and Liabilities Lists */}
            <div className="grid gap-6 md:grid-cols-2 4xl:gap-10">
                <AssetList userSettings={userSettings} type="asset" />
                <AssetList userSettings={userSettings} type="liability" />
            </div>
        </div>
    );
}
