import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import LandingPageContent from "@/components/landing/LandingPageContent";

export default async function LandingPage() {
    const { userId } = await auth();

    if (userId) {
        redirect("/dashboard");
    }

    return <LandingPageContent />;
}
