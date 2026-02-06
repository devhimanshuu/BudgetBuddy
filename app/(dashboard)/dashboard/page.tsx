import { Button } from "@/components/ui/button";
import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import React from "react";
import CreateTransactionDialog from "../_components/CreateTransactionDialog";
import Overview from "../_components/Overview";
import History from "../_components/History";
import BudgetOverview from "../_components/BudgetOverview";
import NetWorthCard from "../_components/NetWorthCard";
import SpendingTrends from "../_components/SpendingTrends";
import TopCategories from "../_components/TopCategories";
import SavingsRate from "../_components/SavingsRate";
import SavingsGoals from "../_components/SavingsGoals";
import RecentTransactions from "../_components/RecentTransactions";
import { DueTransactionsPopup } from "../_components/DueTransactionsPopup";
import { SubscriptionAlerts } from "../_components/SubscriptionAlerts";
import StreakDisplay from "../_components/StreakDisplay";

async function page() {
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
        <div className="h-full bg-background ">
            <DueTransactionsPopup userSettings={userSettings} />
            <div className="border-b bg-card">
                <div className="container flex flex-wrap items-center justify-between gap-6 py-4 3xl:gap-8 4xl:py-8">
                    <p className="text-3xl font-bold 3xl:text-4xl 4xl:text-5xl">Hello, {user.firstName}</p>

                    <div className="flex items-center gap-3 3xl:gap-4 4xl:gap-6">
                        <CreateTransactionDialog
                            trigger={
                                <Button
                                    variant={"outline"}
                                    className="border-emerald-500 bg-emerald-950 text-white hover:bg-emerald-700 hover:text-white 3xl:text-base 4xl:text-lg 4xl:px-6 4xl:py-6"
                                >
                                    New Income
                                </Button>
                            }
                            type="income"
                        />
                        <CreateTransactionDialog
                            trigger={
                                <Button
                                    variant={"outline"}
                                    className="border-rose-500 bg-rose-950 text-white hover:bg-rose-700 hover:text-white 3xl:text-base 4xl:text-lg 4xl:px-6 4xl:py-6"
                                >
                                    New Expense
                                </Button>
                            }
                            type="expense"
                        />
                    </div>
                </div>
            </div>
            {/* Dashboard Widgets */}
            <div className="container py-6 4xl:py-10">
                <SubscriptionAlerts />

                {/* Gamification Streak Display */}
                <div className="mb-4 3xl:mb-6">
                    <StreakDisplay />
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 2xl:gap-6 4xl:gap-8">
                    <div className="md:col-span-2 3xl:col-span-1 h-full">
                        <NetWorthCard userSettings={userSettings} />
                    </div>
                    <div className="md:col-span-2 3xl:col-span-1 h-full">
                        <SavingsRate userSettings={userSettings} />
                    </div>
                    <div className="md:col-span-2 3xl:col-span-1 h-full">
                        <SpendingTrends userSettings={userSettings} />
                    </div>
                    <div className="md:col-span-2 3xl:col-span-1 h-full">
                        <TopCategories userSettings={userSettings} />
                    </div>
                </div>
            </div>

            <div className="container py-0 mb-6 4xl:mb-10">
                <RecentTransactions userSettings={userSettings} />
            </div>

            <Overview userSettings={userSettings} />

            <div className="container py-6 4xl:py-8">
                <BudgetOverview userSettings={userSettings} />
            </div>

            <div className="container py-6 3xl:py-8 4xl:py-10">
                <SavingsGoals userSettings={userSettings} />
            </div>

            <History userSettings={userSettings} />
        </div>
    );
}

export default page;
