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
    const { data: activities, isLoading } = useQuery<Activity[]>({
        queryKey: ["workspace-activities"],
        queryFn: () => fetch("/api/activities").then((res) => res.json()),
    });

    return (
        <Card className="border-primary/10 bg-gradient-to-br from-card to-primary/5">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-xl font-bold">
                        <ActivityIcon className="w-5 h-5 text-primary" />
                        Workspace Activity
                    </CardTitle>
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                        Live Feed
                    </Badge>
                </div>
                <CardDescription>
                    Recent actions and updates across your workspace
                </CardDescription>
            </CardHeader>
            <CardContent>
                <SkeletonWrapper isLoading={isLoading}>
                    <div className="space-y-4">
                        {activities && activities.length > 0 ? (
                            activities.map((activity, idx) => (
                                <ActivityItem 
                                    key={activity.id} 
                                    activity={activity} 
                                    isLast={idx === activities.length - 1}
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

function ActivityItem({ activity, isLast }: { activity: Activity; isLast: boolean }) {
    const Icon = getActivityIcon(activity.type);
    const color = getActivityColor(activity.type);
    
    return (
        <div className="flex gap-4 group">
            <div className="flex flex-col items-center">
                <div className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm border",
                    color
                )}>
                    <Icon className="w-4 h-4" />
                </div>
                {!isLast && <div className="w-px flex-grow bg-border my-1 group-hover:bg-primary/30 transition-colors" />}
            </div>
            <div className="pb-6 w-full min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <p className="text-sm font-semibold leading-none mb-1.5 truncate">
                            {activity.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1 opacity-80">
                                <User className="w-3 h-3" />
                                {activity.userId === "system" ? "System" : (activity.metadata?.userName || "Member")}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-border" />
                            <span className="flex items-center gap-1 opacity-80">
                                <Clock className="w-3 h-3" />
                                {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                            </span>
                        </div>
                    </div>
                    {activity.metadata?.amount && (
                        <Badge 
                            variant="outline" 
                            className={cn(
                                "shrink-0 font-mono",
                                activity.metadata.type === "income" 
                                    ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/5" 
                                    : "border-red-500/30 text-red-500 bg-red-500/5"
                            )}
                        >
                            {activity.metadata.type === "income" ? "+" : "-"}${activity.metadata.amount.toLocaleString()}
                        </Badge>
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
