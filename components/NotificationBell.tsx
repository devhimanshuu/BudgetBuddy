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
import { motion, AnimatePresence } from "framer-motion";
import { 
    CheckCheck, 
    ArrowRight, 
    TrendingUp, 
    TrendingDown, 
    UserPlus, 
    LayoutDashboard, 
    Settings,
    FileText
} from "lucide-react";

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
                    <Bell className="h-4 w-4 3xl:h-5 3xl:w-5 4xl:h-6 4xl:w-6 text-muted-foreground group-hover:text-foreground transition-colors" />
                    <AnimatePresence>
                        {unreadCount > 0 && (
                            <motion.span 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                className="absolute -top-0.5 -right-0.5 flex h-4 w-4 3xl:h-5 3xl:w-5 items-center justify-center rounded-full bg-rose-500 text-[9px] 3xl:text-[11px] font-black text-white shadow-lg ring-2 ring-background"
                            >
                                {unreadCount > 9 ? "9+" : unreadCount}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </Button>

            </PopoverTrigger>
            <PopoverContent 
                className="w-[350px] sm:w-[380px] p-0 border-border bg-background/95 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden" 
                align="end" 
                sideOffset={8}
            >
                <div className="flex items-center justify-between p-4 border-b border-border/50 bg-gradient-to-r from-muted/50 to-background">
                    <div className="flex flex-col gap-0.5">
                        <h3 className="text-sm font-black tracking-tight uppercase italic">Notifications</h3>
                        <p className={cn(
                            "text-[10px] font-bold uppercase tracking-widest",
                            unreadCount > 0 ? "text-rose-500" : "text-muted-foreground"
                        )}>
                            {unreadCount} {unreadCount === 1 ? "Update" : "Updates"} pending
                        </p>
                    </div>
                    {unreadCount > 0 && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary hover:bg-primary/10 transition-all rounded-xl px-3 gap-2 border border-primary/10"
                            onClick={() => markAllReadMutation.mutate()}
                            disabled={markAllReadMutation.isPending}
                        >
                            <CheckCheck className="h-3 w-3" />
                            Clear All
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
                                        "group relative flex items-start gap-3 p-4 transition-all duration-300 hover:bg-muted/50 cursor-pointer overflow-hidden",
                                        !notification.isRead && "bg-primary/[0.03]"
                                    )}
                                    onClick={() => !notification.isRead && markReadMutation.mutate(notification.id)}
                                >
                                    {/* Unread Indicator Bar */}
                                    {!notification.isRead && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                                    )}

                                    <div className={cn(
                                        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border border-border/50 shadow-sm transition-all duration-500 group-hover:rotate-6 group-hover:scale-110",
                                        !notification.isRead ? "bg-primary/10 text-primary border-primary/20" : "bg-muted/50 text-muted-foreground"
                                    )}>
                                        <ActivityIcon type={notification.activity.type} />
                                    </div>
                                    <div className="flex flex-col gap-1 min-w-0 pr-4">
                                        <p className={cn(
                                            "text-[13px] leading-snug transition-colors",
                                            !notification.isRead ? "font-bold text-foreground" : "font-medium text-muted-foreground"
                                        )}>
                                            {notification.activity.description}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">
                                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                            </span>
                                            {!notification.isRead && (
                                                <span className="h-1 w-1 rounded-full bg-primary animate-pulse" />
                                            )}
                                        </div>
                                    </div>
                                    <ArrowRight className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" />
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
            return <TrendingUp className="h-4 w-4" />;
        case "TRANSACTION_UPDATED":
            return <FileText className="h-4 w-4" />;
        case "TRANSACTION_DELETED":
            return <TrendingDown className="h-4 w-4" />;
        case "BUDGET_PROPOSED":
        case "BUDGET_CREATED":
            return <LayoutDashboard className="h-4 w-4" />;
        case "BUDGET_FINALIZED":
            return <CheckCheck className="h-4 w-4" />;
        case "MEMBER_JOINED":
        case "MEMBER_INVITED":
            return <UserPlus className="h-4 w-4" />;
        case "PERMISSIONS_UPDATED":
        case "OWNERSHIP_TRANSFERRED":
            return <Settings className="h-4 w-4" />;
        default:
            return <Bell className="h-4 w-4" />;
    }
}

