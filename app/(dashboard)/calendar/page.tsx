import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import React from "react";
import FinanceCalendar from "./_components/FinanceCalendar";
import prisma from "@/lib/prisma";

async function CalendarPage() {
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
        <div className="h-full bg-background">
            <div className="border-b bg-card">
                <div className="container flex flex-wrap items-center justify-between gap-6 py-4">
                    <div>
                        <p className="text-3xl font-bold">Finance Calendar</p>
                        <p className="text-muted-foreground">
                            Visualize your income and expenses over time
                        </p>
                    </div>
                </div>
            </div>

            <div className="container py-6">
                <FinanceCalendar userSettings={userSettings} />
            </div>
        </div>
    );
}

export default CalendarPage;
