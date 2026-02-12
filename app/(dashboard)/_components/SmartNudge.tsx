"use client";

import { useQuery } from "@tanstack/react-query";
import { Sparkles, Loader2, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { GetAiNudge, AiNudgeResult } from "@/app/(dashboard)/_actions/get-ai-nudge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function SmartNudge() {
    const { data, isLoading, isError } = useQuery<AiNudgeResult | null>({
        queryKey: ["ai-nudge"],
        queryFn: () => GetAiNudge(),
        staleTime: 1000 * 60 * 60, // 1 hour cache, nudges don't change that fast
        retry: false,
    });

    if (isLoading) {
        return (
            <div className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm w-full h-[72px]">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
            </div>
        );
    }

    if (isError || !data || !data.message) return null;

    const iconMap = {
        warning: AlertTriangle,
        success: CheckCircle,
        info: Info,
        neutral: Sparkles,
    };

    const colorMap = {
        warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
        success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
        info: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
        neutral: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800",
    };

    const Icon = iconMap[data.type] || Sparkles;
    const colorClass = colorMap[data.type] || colorMap.neutral;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                    "relative flex items-center gap-4 rounded-xl border p-4 shadow-sm transition-all hover:shadow-md",
                    "bg-card/50 backdrop-blur-sm", // Glass effect
                    colorClass.split(" ")[0] === "bg-card" ? "border-border" : colorClass.split(" ").slice(2).join(" ") // Use specialized border if available
                )}
            >
                <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full border", colorClass)}>
                    <Icon className="h-5 w-5" />
                </div>

                <div className="space-y-1">
                    <p className="text-sm font-medium leading-none flex items-center gap-2">
                        AI Financial Analyst
                        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                            Beta
                        </span>
                    </p>
                    <p className="text-sm text-foreground/80">
                        {data.message}
                    </p>
                </div>

                <div className="absolute right-4 top-4">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
