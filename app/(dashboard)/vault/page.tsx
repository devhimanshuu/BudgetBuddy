import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import VaultContent from "./_components/VaultContent";
import VaultGuard from "./_components/VaultGuard";

export default async function VaultPage() {
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
			<div className="flex flex-col gap-2">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/20 3xl:h-12 3xl:w-12">
						<span className="text-xl 3xl:text-2xl">🏛️</span>
					</div>
					<div>
						<h1 className="text-3xl font-bold 3xl:text-4xl 4xl:text-5xl">
							Legacy Vault
						</h1>
						<p className="text-muted-foreground 4xl:text-lg">
							Secure your digital heritage and emergency information
						</p>
					</div>
				</div>
			</div>

			<VaultGuard>
				<VaultContent />
			</VaultGuard>
		</div>
	);
}

