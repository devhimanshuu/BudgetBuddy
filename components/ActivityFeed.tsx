"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    PlusCircle,
    UserPlus,
    Settings,
    Trash2,
    LogIn,
    ArrowUpRight,
    ArrowDownLeft,
    Calendar,
    Clock
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

const typeMap: Record<string, { icon: any; color: string }> = {
    TRANSACTION_CREATED: { icon: PlusCircle, color: "text-blue-500" },
    TRANSACTION_UPDATED: { icon: Settings, color: "text-blue-400" },
    TRANSACTION_DELETED: { icon: Trash2, color: "text-red-500" },
    MEMBER_INVITED: { icon: UserPlus, color: "text-amber-500" },
    MEMBER_JOINED: { icon: LogIn, color: "text-green-500" },
    MEMBER_REMOVED: { icon: Trash2, color: "text-red-500" },
    ROLE_UPDATED: { icon: Settings, color: "text-purple-500" },
    WORKSPACE_CREATED: { icon: PlusCircle, color: "text-emerald-500" },
    INVITE_REVOKED: { icon: Trash2, color: "text-red-400" },
};

export default function ActivityFeed() {
    const { data, isLoading } = useQuery<{ activities: any[], currency: string }>({
        queryKey: ["workspace-activity"],
        queryFn: () => fetch("/api/activities").then((res) => res.json()),
    });

    const activities = data?.activities;

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Clock className="w-5 h-5 text-muted-foreground" />
                        Recent Activity
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-4">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-3 w-1/2" />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-none shadow-md bg-white/50 dark:bg-black/20 backdrop-blur-xl transition-all duration-300 hover:shadow-lg">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Recent Activity
                </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
                {!activities || activities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground italic">
                        <Calendar className="w-8 h-8 mb-2 opacity-20" />
                        No recent activity
                    </div>
                ) : (
                    <div className="divide-y divide-border/50">
                        {activities?.map((activity: any) => {
                            const meta = typeMap[activity.type] || { icon: Clock, color: "text-muted-foreground" };
                            const Icon = meta.icon;

                            return (
                                <div
                                    key={activity.id}
                                    className="flex gap-4 p-4 transition-colors hover:bg-muted/30"
                                >
                                    <div className={cn("p-2 rounded-full h-fit flex-shrink-0 bg-background shadow-sm border border-border/50", meta.color)}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium leading-normal text-foreground/90">
                                            {activity.description}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                            {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
