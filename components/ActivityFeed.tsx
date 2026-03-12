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
import { Badge } from "@/components/ui/badge";

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
            <Card className="border-none shadow-md bg-white/50 dark:bg-black/20 backdrop-blur-xl">
                <CardHeader className="pb-3 px-6">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary animate-pulse" />
                        Recent Activity
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 px-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex gap-4">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-4 w-[80%]" />
                                <Skeleton className="h-3 w-[40%]" />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-none shadow-md bg-white/50 dark:bg-black/20 backdrop-blur-xl transition-all duration-300 hover:shadow-lg h-full overflow-hidden flex flex-col">
            <CardHeader className="pb-3 px-6 shrink-0">
                <CardTitle className="text-lg font-bold flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary" />
                        Recent Activity
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto grow custom-scrollbar">
                {!activities || activities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/60 italic px-6">
                        <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                             <Calendar className="w-8 h-8 opacity-20" />
                        </div>
                        <p className="text-sm font-medium">No activity yet</p>
                        <p className="text-xs">New events will appear here</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border/30">
                        {activities?.map((activity: any) => {
                            const meta = typeMap[activity.type] || { icon: Clock, color: "text-muted-foreground" };
                            const Icon = meta.icon;

                            return (
                                <div
                                    key={activity.id}
                                    className="flex gap-3 p-4 transition-all hover:bg-muted/30 group"
                                >
                                    <div className="relative shrink-0">
                                        {activity.user?.imageUrl ? (
                                            <img
                                                src={activity.user.imageUrl}
                                                alt={activity.user.name}
                                                className="h-9 w-9 rounded-full border border-border/50 shadow-sm"
                                            />
                                        ) : (
                                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center border border-border/50">
                                                <span className="text-[10px] font-bold text-primary uppercase">
                                                    {activity.user?.name?.slice(0, 2)}
                                                </span>
                                            </div>
                                        )}
                                        <div className={cn(
                                            "absolute -bottom-1 -right-1 p-1 rounded-full bg-background border border-border/50 shadow-sm",
                                            meta.color
                                        )}>
                                            <Icon className="w-2.5 h-2.5" />
                                        </div>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="text-sm font-bold text-foreground">
                                                {activity.user?.name}
                                            </span>
                                            <p className="text-sm text-muted-foreground leading-snug">
                                                {activity.description.replace(activity.user?.name || "", "").trim()}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className="text-[10px] text-muted-foreground/80 flex items-center gap-1">
                                                <Clock className="w-2.5 h-2.5" />
                                                {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                                            </p>
                                            {activity.metadata?.type && (
                                                <Badge variant="outline" className="text-[9px] h-3.5 px-1 bg-muted/30">
                                                    {activity.metadata.type}
                                                </Badge>
                                            )}
                                        </div>
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
