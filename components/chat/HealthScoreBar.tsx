"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface HealthScoreBarProps {
    healthScore: number;
}

export const HealthScoreBar = ({ healthScore }: HealthScoreBarProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="px-4 py-2 border-b border-border bg-gradient-to-r from-primary/5 to-transparent flex items-center justify-between gap-3 shrink-0"
        >
            <div className="flex items-center gap-2">
                <Sparkles className="h-3 w-3 text-amber-500" />
                <span className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">Financial Health</span>
            </div>
            <div className="flex-1 max-w-[120px]">
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${healthScore}%` }}
                        className={cn(
                            "h-full transition-all duration-1000",
                            healthScore > 70 ? "bg-emerald-500" : healthScore > 40 ? "bg-amber-500" : "bg-destructive"
                        )}
                    />
                </div>
            </div>
            <span className={cn(
                "text-[10px] font-black",
                healthScore > 70 ? "text-emerald-500" : healthScore > 40 ? "text-amber-500" : "text-destructive"
            )}>
                {healthScore}%
            </span>
        </motion.div>
    );
};
