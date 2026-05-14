"use client";

import React, { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GetBillSplits, SettleBillSplit } from "@/app/(dashboard)/_actions/bills";
import { GetActiveWorkspace, GetWorkspaceMembers } from "@/app/(dashboard)/_actions/workspaces";
import SkeletonWrapper from "@/components/SkeletonWrapper";
import GlassCard from "@/components/GlassCard";
import { CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    HandCoins,
    CheckCircle2,
    Clock,
    TrendingUp,
    TrendingDown,
    UserCircle2,
    CheckCheck,
    AlertTriangle
} from "lucide-react";

import { GetFormatterForCurrency } from "@/lib/helper";
import { useUser } from "@clerk/nextjs";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type BillSplitWithTransaction = {
    id: string;
    transactionId: string;
    debtorId: string;
    debtorName: string | null;
    amount: number;
    isPaid: boolean;
    paidAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    transaction: {
        description: string;
        amount: number;
        date: Date;
        userId: string;
        category: string;
        categoryIcon: string;
    };
};


export default function SettlementClient() {
    const { user } = useUser();
    const queryClient = useQueryClient();

    const activeWorkspaceQuery = useQuery({
        queryKey: ["active-workspace"],
        queryFn: () => GetActiveWorkspace(),
    });

    const membersQuery = useQuery({
        queryKey: ["workspace-members", activeWorkspaceQuery.data?.id],
        queryFn: () => GetWorkspaceMembers(activeWorkspaceQuery.data!.id),
        enabled: !!activeWorkspaceQuery.data?.id,
    });

    const splitsQuery = useQuery<BillSplitWithTransaction[]>({
        queryKey: ["bill-splits"],
        queryFn: () => GetBillSplits() as Promise<BillSplitWithTransaction[]>,
    });


    const settleMutation = useMutation({
        mutationFn: (id: string) => SettleBillSplit(id),
        onSuccess: () => {
            toast.success("Bill settled successfully!");
            queryClient.invalidateQueries({ queryKey: ["bill-splits"] });
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to settle bill");
        }
    });

    const formatter = useMemo(() => {
        return GetFormatterForCurrency(activeWorkspaceQuery.data?.currency || "USD");
    }, [activeWorkspaceQuery.data?.currency]);

    // Derived data
    const totals = useMemo(() => {
        if (!splitsQuery.data || !user) return { owedToMe: 0, iOwe: 0 };

        return (splitsQuery.data as BillSplitWithTransaction[]).reduce((acc, split) => {

            if (split.isPaid) return acc;

            if (split.transaction.userId === user.id) {
                acc.owedToMe += split.amount;
            } else if (split.debtorId === user.id) {
                acc.iOwe += split.amount;
            }
            return acc;
        }, { owedToMe: 0, iOwe: 0 });
    }, [splitsQuery.data, user]);

    const owedToMeList = useMemo(() => {
        return (splitsQuery.data as BillSplitWithTransaction[])?.filter(s => s.transaction.userId === user?.id && !s.isPaid) || [];

    }, [splitsQuery.data, user]);

    const iOweList = useMemo(() => {
        return (splitsQuery.data as BillSplitWithTransaction[])?.filter(s => s.debtorId === user?.id && !s.isPaid) || [];

    }, [splitsQuery.data, user]);

    const historyList = useMemo(() => {
        return (splitsQuery.data as BillSplitWithTransaction[])?.filter(s => s.isPaid) || [];

    }, [splitsQuery.data]);

    if (splitsQuery.isLoading || activeWorkspaceQuery.isLoading) {
        return (
            <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                    <SkeletonWrapper isLoading={true}><div className="h-32 w-full rounded-2xl" /></SkeletonWrapper>
                    <SkeletonWrapper isLoading={true}><div className="h-32 w-full rounded-2xl" /></SkeletonWrapper>
                </div>
                <SkeletonWrapper isLoading={true}><div className="h-96 w-full rounded-2xl" /></SkeletonWrapper>
            </div>
        );
    }

    if (splitsQuery.isError || activeWorkspaceQuery.isError) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-rose-500/5 rounded-3xl border border-dashed border-rose-500/20">
                <div className="p-4 bg-background rounded-2xl shadow-sm mb-4 text-rose-500">
                    <AlertTriangle className="w-10 h-10" />
                </div>
                <p className="text-sm font-black text-rose-600 uppercase tracking-widest">
                    Failed to load financial data
                </p>
                <Button
                    variant="outline"
                    className="mt-4 rounded-xl border-rose-500/30 text-rose-600 hover:bg-rose-500 hover:text-white"
                    onClick={() => {
                        splitsQuery.refetch();
                        activeWorkspaceQuery.refetch();
                    }}
                >
                    Retry Connection
                </Button>
            </div>
        );
    }

    const getMemberName = (userId: string) => {
        const member = membersQuery.data?.find(m => m.userId === userId);
        if (member) return member.name;
        return `User (${userId.slice(0, 4)})`;
    };

    return (
        <div className="space-y-6 4xl:space-y-10 pb-10">

            {/* Stats Overview */}
            <div className="grid gap-6 md:grid-cols-2 4xl:gap-10">
                <GlassCard className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.02] to-transparent">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-heading-md text-emerald-600">
                                Owed to You
                            </CardTitle>
                            <div className="p-2 bg-emerald-500/10 rounded-xl">
                                <TrendingUp className="w-5 h-5 text-emerald-600" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-heading-xl text-emerald-600">
                            {formatter.format(totals.owedToMe)}
                        </p>
                        <p className="text-body-premium mt-1">
                            Total amount others need to pay you
                        </p>
                    </CardContent>

                </GlassCard>

                <GlassCard className="border-rose-500/20 bg-gradient-to-br from-rose-500/[0.02] to-transparent">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-heading-md text-rose-600">
                                You Owe
                            </CardTitle>
                            <div className="p-2 bg-rose-500/10 rounded-xl">
                                <TrendingDown className="w-5 h-5 text-rose-600" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-heading-xl text-rose-600">
                            {formatter.format(totals.iOwe)}
                        </p>
                        <p className="text-body-premium mt-1">
                            Total amount you need to pay back
                        </p>
                    </CardContent>

                </GlassCard>
            </div>

            {/* Detailed Lists */}
            <Tabs defaultValue="owed-to-me" className="w-full">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                    <TabsList className="bg-muted/50 p-1 rounded-2xl h-12">
                        <TabsTrigger 
                            value="owed-to-me" 
                            className="rounded-xl px-6 text-heading-sm data-[state=active]:bg-background data-[state=active]:text-primary"
                        >
                            Owed to me ({owedToMeList.length})
                        </TabsTrigger>
                        <TabsTrigger 
                            value="i-owe" 
                            className="rounded-xl px-6 text-heading-sm data-[state=active]:bg-background data-[state=active]:text-primary"
                        >
                            I owe ({iOweList.length})
                        </TabsTrigger>
                        <TabsTrigger 
                            value="history" 
                            className="rounded-xl px-6 text-heading-sm data-[state=active]:bg-background data-[state=active]:text-primary"
                        >
                            Settled
                        </TabsTrigger>
                    </TabsList>

                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 h-8 px-4 text-heading-sm">
                        {activeWorkspaceQuery.data?.name.toUpperCase()} WORKSPACE
                    </Badge>
                </div>

                <TabsContent value="owed-to-me">
                    <div className="grid gap-4">
                        {owedToMeList.length === 0 ? (
                            <EmptyState icon={<CheckCircle2 className="w-10 h-10" />} message="Nobody owes you money! Great for your friendships." />
                        ) : (
                            owedToMeList.map(split => (
                                <SettlementItem
                                    key={split.id}
                                    split={split}
                                    mode="owed-to-me"
                                    formatter={formatter}
                                    onSettle={() => settleMutation.mutate(split.id)}
                                    isPending={settleMutation.isPending}
                                    getMemberName={getMemberName}
                                />

                            ))
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="i-owe">
                    <div className="grid gap-4">
                        {iOweList.length === 0 ? (
                            <EmptyState icon={<HandCoins className="w-10 h-10" />} message="You're all clear! No debts pending." />
                        ) : (
                            iOweList.map(split => (
                                <SettlementItem
                                    key={split.id}
                                    split={split}
                                    mode="i-owe"
                                    formatter={formatter}
                                    onSettle={() => settleMutation.mutate(split.id)}
                                    isPending={settleMutation.isPending}
                                    getMemberName={getMemberName}
                                />

                            ))
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="history">
                    <div className="grid gap-4">
                        {historyList.length === 0 ? (
                            <EmptyState icon={<Clock className="w-10 h-10" />} message="No settlement history yet." />
                        ) : (
                            historyList.map(split => (
                                <SettlementItem
                                    key={split.id}
                                    split={split}
                                    mode="history"
                                    formatter={formatter}
                                    getMemberName={getMemberName}
                                />

                            ))
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function EmptyState({ icon, message }: { icon: React.ReactNode, message: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-3xl border border-dashed border-border/50">
            <div className="p-4 bg-background rounded-2xl shadow-sm mb-4 text-muted-foreground/30">
                {icon}
            </div>
            <p className="text-sm font-medium text-muted-foreground italic">
                {message}
            </p>
        </div>
    );
}

interface SettlementItemProps {
    split: BillSplitWithTransaction;
    mode: "owed-to-me" | "i-owe" | "history";

    formatter: Intl.NumberFormat;
    onSettle?: () => void;
    isPending?: boolean;
    getMemberName: (userId: string) => string;
}

function SettlementItem({ split, mode, formatter, onSettle, isPending, getMemberName }: SettlementItemProps) {

    const isHistory = mode === "history";
    const isPayer = mode === "owed-to-me";

    return (
        <div className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-background/50 border border-border/50 rounded-2xl transition-all hover:bg-background hover:shadow-xl hover:border-primary/20 overflow-hidden">
            {/* Decoration Bar */}
            <div className={cn(
                "absolute left-0 top-0 bottom-0 w-1",
                isHistory ? "bg-muted" : isPayer ? "bg-emerald-500" : "bg-rose-500"
            )} />

            <div className="flex items-center gap-4 mb-3 sm:mb-0">
                <div className={cn(
                    "h-12 w-12 rounded-xl flex items-center justify-center text-xl shrink-0 border border-border/50 shadow-sm transition-transform group-hover:scale-110",
                    isHistory ? "bg-muted text-muted-foreground" : "bg-background"
                )}>
                    {split.transaction.categoryIcon || "💰"}
                </div>
                <div className="min-w-0">
                    <h4 className="text-heading-md group-hover:text-primary transition-colors truncate pr-4">
                        {split.transaction.description || split.transaction.category}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="text-heading-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(split.transaction.date), { addSuffix: true })}
                        </span>
                        <Badge variant="secondary" className="h-4 text-heading-sm bg-muted/50 text-muted-foreground border-none">
                            {split.transaction.category.toUpperCase()}
                        </Badge>
                    </div>
                </div>

            </div>

            <div className="flex items-center justify-between sm:justify-end gap-4">
                <div className="text-right">
                    <p className={cn(
                        "text-heading-lg",
                        isHistory ? "text-muted-foreground line-through" : isPayer ? "text-emerald-600" : "text-rose-600"
                    )}>
                        {formatter.format(split.amount)}
                    </p>
                    <div className="flex items-center gap-1.5 justify-end mt-1">
                        <UserCircle2 className="w-3 h-3 text-muted-foreground" />
                        <span className="text-heading-sm text-muted-foreground">
                            {isPayer ? `from ${split.debtorName || "Member"}` : `to ${getMemberName(split.transaction.userId)}`}
                        </span>

                    </div>
                </div>

                {!isHistory && (
                    <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                            "h-9 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest gap-2 transition-all",
                            isPayer
                                ? "border-emerald-500/30 text-emerald-600 hover:bg-emerald-500 hover:text-white"
                                : "border-rose-500/30 text-rose-600 hover:bg-rose-500 hover:text-white"
                        )}
                        onClick={onSettle}
                        disabled={isPending}
                    >
                        {isPending ? <CheckCircle2 className="w-3 h-3 animate-pulse" /> : <CheckCheck className="w-3 h-3" />}
                        {isPayer ? "Got it" : "Paid"}
                    </Button>
                )}

                {isHistory && (
                    <Badge variant="outline" className="h-9 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest gap-2 bg-emerald-500/5 text-emerald-600 border-emerald-500/20">
                        <CheckCheck className="w-3 h-3" />
                        Settled
                    </Badge>
                )}
            </div>
        </div>
    );
}
