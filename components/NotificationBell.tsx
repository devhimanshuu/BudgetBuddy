"use client";

import React, { useEffect, useRef, useState } from "react";
import { Bell, Circle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
    getNotifications, 
    getUnreadCount, 
    markAsRead, 
    markAllAsRead 
} from "@/app/(dashboard)/_actions/notifications";
import { GetActiveWorkspace } from "@/app/(dashboard)/_actions/workspaces";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export function NotificationBell() {
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const prevCountRef = useRef<number | undefined>(undefined);

    const activeWorkspaceQuery = useQuery({
        queryKey: ["active-workspace"],
        queryFn: () => GetActiveWorkspace(),
    });

    const workspaceId = activeWorkspaceQuery.data?.id;

    const unreadCountQuery = useQuery({
        queryKey: ["notifications-unread-count", workspaceId],
        queryFn: () => getUnreadCount(workspaceId!),
        enabled: !!workspaceId,
        refetchInterval: 15000, // Poll every 15 seconds for a "real-time" feel
    });

    const notificationsQuery = useQuery({
        queryKey: ["notifications", workspaceId],
        queryFn: () => getNotifications(workspaceId!),
        enabled: !!workspaceId && open,
    });

    // Notify user via toast when new notification arrives
    useEffect(() => {
        const currentCount = unreadCountQuery.data;
        if (currentCount !== undefined && prevCountRef.current !== undefined && currentCount > prevCountRef.current) {
            toast.info("New activity in workspace", {
                description: "Check your notifications for updates.",
                icon: <Bell className="h-4 w-4" />,
            });
            // Also invalidate the notifications list so it's fresh if open
            queryClient.invalidateQueries({ queryKey: ["notifications", workspaceId] });
        }
        prevCountRef.current = currentCount;
    }, [unreadCountQuery.data, workspaceId, queryClient]);

    const markReadMutation = useMutation({
        mutationFn: (id: string) => markAsRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications", workspaceId] });
            queryClient.invalidateQueries({ queryKey: ["notifications-unread-count", workspaceId] });
        },
    });

    const markAllReadMutation = useMutation({
        mutationFn: () => markAllAsRead(workspaceId!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications", workspaceId] });
            queryClient.invalidateQueries({ queryKey: ["notifications-unread-count", workspaceId] });
            toast.success("All notifications marked as read");
        },
    });

    const unreadCount = unreadCountQuery.data || 0;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative rounded-full hover:bg-accent/50 transition-all duration-300 h-9 w-9 3xl:h-11 3xl:w-11 4xl:h-12 4xl:w-12"
                >
                    <Bell className="h-4 w-4 3xl:h-5 3xl:w-5 4xl:h-6 4xl:w-6 text-muted-foreground hover:text-foreground transition-colors" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 flex h-2 w-2 items-center justify-center">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent 
                className="w-[350px] sm:w-[380px] p-0 border-border bg-background/95 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden" 
                align="end" 
                sideOffset={8}
            >
                <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/30">
                    <div className="flex flex-col gap-0.5">
                        <h3 className="text-sm font-bold tracking-tight">Notifications</h3>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                            {unreadCount} UNREAD
                        </p>
                    </div>
                    {unreadCount > 0 && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 text-[11px] font-bold text-primary hover:text-primary hover:bg-primary/10 transition-all rounded-full px-3"
                            onClick={() => markAllReadMutation.mutate()}
                        >
                            Mark all as read
                        </Button>
                    )}
                </div>

                <ScrollArea className="h-[400px]">
                    <div className="flex flex-col divide-y divide-border/30">
                        {notificationsQuery.isLoading ? (
                            <div className="flex items-center justify-center h-40">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Loading...</span>
                                </div>
                            </div>
                        ) : notificationsQuery.data?.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-60 p-8 text-center">
                                <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                                    <Bell className="h-6 w-6 text-muted-foreground/50" />
                                </div>
                                <h4 className="text-sm font-bold mb-1">All caught up!</h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    No new activities in this workspace.
                                </p>
                            </div>
                        ) : (
                            notificationsQuery.data?.map((notification: any) => (
                                <div 
                                    key={notification.id}
                                    className={cn(
                                        "group relative flex items-start gap-3 p-4 transition-all duration-300 hover:bg-accent/40 cursor-pointer",
                                        !notification.isRead && "bg-primary/5"
                                    )}
                                    onClick={() => !notification.isRead && markReadMutation.mutate(notification.id)}
                                >
                                    <div className={cn(
                                        "h-9 w-9 rounded-full flex items-center justify-center shrink-0 border border-border/50 shadow-sm transition-transform group-hover:scale-105",
                                        !notification.isRead ? "bg-primary/10 text-primary border-primary/20" : "bg-muted/50 text-muted-foreground"
                                    )}>
                                        <ActivityIcon type={notification.activity.type} />
                                    </div>
                                    <div className="flex flex-col gap-1 min-w-0 pr-4">
                                        <p className="text-[13px] font-medium leading-snug">
                                            {notification.activity.description}
                                        </p>
                                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">
                                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                    {!notification.isRead && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                            <div className="h-2 w-2 rounded-full bg-primary" />
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
                
                <div className="p-3 border-t border-border/50 bg-muted/10">
                    <Button 
                        variant="ghost" 
                        className="w-full h-9 text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all rounded-lg"
                        onClick={() => setOpen(false)}
                    >
                        Close
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}

function ActivityIcon({ type }: { type: string }) {
    switch (type) {
        case "TRANSACTION_CREATED":
            return <Circle className="h-2.5 w-2.5 fill-emerald-500 text-emerald-500" />;
        case "TRANSACTION_UPDATED":
            return <Circle className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />;
        case "BUDGET_CREATED":
        case "BUDGET_UPDATED":
            return <Circle className="h-2.5 w-2.5 fill-blue-500 text-blue-500" />;
        case "MEMBER_JOINED":
        case "MEMBER_INVITED":
            return <Circle className="h-2.5 w-2.5 fill-purple-500 text-purple-500" />;
        default:
            return <Circle className="h-2.5 w-2.5 fill-muted-foreground text-muted-foreground" />;
    }
}
