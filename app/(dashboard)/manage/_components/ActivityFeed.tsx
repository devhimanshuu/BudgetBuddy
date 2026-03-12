"use client";

import { useQuery } from "@tanstack/react-query";
import { 
    Activity as ActivityIcon, 
    PlusCircle, 
    UserPlus, 
    Layout, 
    Clock,
    User,
    Settings,
    Tag,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { GetFormatterForCurrency } from "@/lib/helper";
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardHeader, 
    CardTitle 
} from "@/components/ui/card";
import SkeletonWrapper from "@/components/SkeletonWrapper";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Activity {
    id: string;
    type: string;
    description: string;
    userId: string;
    createdAt: string;
    metadata: any;
}

export default function ActivityFeed() {
    const { data, isLoading } = useQuery<{ activities: Activity[], currency: string }>({
        queryKey: ["workspace-activities"],
        queryFn: () => fetch("/api/activities").then((res) => res.json()),
    });

    const activities = data?.activities;
    const currency = data?.currency || "USD";

    return (
        <Card className="border-primary/10 bg-gradient-to-br from-card to-primary/5">
            <CardHeader className="pb-3 border-b border-border/10 shrink-0">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-xl font-bold text-primary">
                        <ActivityIcon className="w-5 h-5" />
                        Workspace Activity
                    </CardTitle>
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[10px] h-5">
                        Live Feed
                    </Badge>
                </div>
                <CardDescription className="text-xs">
                    Comprehensive log of all actions within this workspace
                </CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto max-h-[500px] custom-scrollbar bg-background/5">
                <SkeletonWrapper isLoading={isLoading}>
                    <div className="divide-y divide-border/30">
                        {activities && activities.length > 0 ? (
                            activities.map((activity, idx) => (
                                <ActivityItem 
                                    key={activity.id} 
                                    activity={activity} 
                                    currency={currency}
                                    isLast={idx === (activities?.length || 0) - 1}
                                />
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center bg-background/40 rounded-xl border border-dashed border-border/50">
                                <Clock className="w-10 h-10 text-muted-foreground/30 mb-2" />
                                <p className="text-sm text-muted-foreground font-medium">No activity yet</p>
                                <p className="text-xs text-muted-foreground/60">Actions in this workspace will appear here</p>
                            </div>
                        )}
                    </div>
                </SkeletonWrapper>
            </CardContent>
        </Card>
    );
}

function ActivityItem({ activity, isLast, currency }: { activity: Activity; isLast: boolean; currency: string }) {
    const Icon = getActivityIcon(activity.type);
    const color = getActivityColor(activity.type);
    const formatter = GetFormatterForCurrency(currency);
    
    return (
        <div className="flex gap-4 p-4 transition-all hover:bg-muted/40 group relative overflow-hidden">
            <div className="shrink-0 flex flex-col items-center">
                <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center shadow-sm border border-border/50 bg-background",
                    color
                )}>
                    <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                </div>
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground leading-snug mb-1 group-hover:text-primary transition-colors">
                            {activity.description}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1.5 font-medium">
                                <User className="w-3 h-3 text-primary/60" />
                                {activity.userId === "system" ? "System" : (activity.metadata?.userName || "Member")}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-border" />
                            <span className="flex items-center gap-1.5">
                                <Clock className="w-3 h-3 text-primary/60" />
                                {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                            </span>
                        </div>
                    </div>
                    {activity.metadata?.amount && (
                        <div className="text-right shrink-0">
                            <Badge 
                                variant="outline" 
                                className={cn(
                                    "font-mono text-xs font-bold",
                                    activity.metadata.type === "income" 
                                        ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/5" 
                                        : "border-red-500/30 text-red-500 bg-red-500/5"
                                )}
                            >
                                {activity.metadata.type === "income" ? "+" : "-"}{formatter.format(activity.metadata.amount)}
                            </Badge>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function getActivityIcon(type: string) {
    switch (type) {
        case "TRANSACTION_CREATED":
            return PlusCircle;
        case "MEMBER_INVITED":
            return UserPlus;
        case "WORKSPACE_CREATED":
            return Layout;
        case "CATEGORY_CREATED":
            return Tag;
        case "MEMBER_JOINED":
            return UserPlus;
        case "SETTING_UPDATED":
            return Settings;
        default:
            return ActivityIcon;
    }
}

function getActivityColor(type: string) {
    switch (type) {
        case "TRANSACTION_CREATED":
            return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
        case "MEMBER_INVITED":
            return "bg-blue-500/10 text-blue-500 border-blue-500/20";
        case "WORKSPACE_CREATED":
            return "bg-amber-500/10 text-amber-500 border-amber-500/20";
        case "CATEGORY_CREATED":
            return "bg-purple-500/10 text-purple-500 border-purple-500/20";
        case "MEMBER_JOINED":
            return "bg-indigo-500/10 text-indigo-500 border-indigo-500/20";
        case "SETTING_UPDATED":
            return "bg-slate-500/10 text-slate-500 border-slate-500/20";
        default:
            return "bg-primary/10 text-primary border-primary/20";
    }
}
