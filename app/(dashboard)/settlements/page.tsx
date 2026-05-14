import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import SettlementClient from "./_components/SettlementClient";
import { HandCoins } from "lucide-react";

export default async function SettlementsPage() {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	return (
		<div className="container mx-auto space-y-6 p-6 4xl:space-y-10 4xl:p-10">
			{/* Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div>
					<h1 className="text-heading-xl flex items-center gap-3">
                        <HandCoins className="w-8 h-8 3xl:w-10 3xl:h-10 text-primary" />
						Settlements
					</h1>
					<p className="text-body-premium">
						Track who paid for what and settle your shared workspace debts
					</p>
				</div>

			</div>

            <SettlementClient />
		</div>
	);
}
