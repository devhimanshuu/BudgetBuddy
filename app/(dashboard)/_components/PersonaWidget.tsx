
"use client";

import React from "react";
import { PersonaData, PERSONA_THEME } from "@/lib/persona";
import GlassCard from "@/components/GlassCard";
import { cn } from "@/lib/utils";
import {
    Zap,
    AlertTriangle,
    Wallet,
    TrendingDown,
    Target,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface PersonaWidgetProps {
    data: PersonaData;
}

export default function PersonaWidget({ data }: PersonaWidgetProps) {
    const config = PERSONA_THEME[data.persona];
    const scoreColor =
        data.healthScore >= 80
            ? "text-emerald-500"
            : data.healthScore >= 50
                ? "text-amber-500"
                : "text-rose-500";

    return (
        <GlassCard className="relative overflow-hidden group">
            <div className="flex flex-col md:flex-row gap-4 p-4 items-stretch">

                {/* Left Column: Icon & Primary Info */}
                <div className="flex-shrink-0 flex md:flex-col items-center gap-3 md:w-40 lg:border-r border-border/50 pr-0 lg:pr-4">
                    <div
                        className={cn(
                            "flex items-center justify-center h-16 w-16 rounded-2xl shadow-lg transition-transform hover:scale-105 duration-300 bg-gradient-to-br text-3xl select-none",
                            config.gradient
                        )}
                    >
                        {config.icon}
                    </div>

                    <div className="text-center md:text-center flex-1 md:flex-none w-full">
                        <div className="flex items-center justify-center gap-2 mb-0.5">
                            <h3 className="text-xl font-bold tracking-tight">
                                {data.persona}
                            </h3>
                        </div>
                        <p className={cn("text-[10px] font-bold uppercase tracking-widest", config.color)}>
                            {config.trait}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1 italic px-1 hidden md:block leading-tight">
                            &quot;{data.personality}&quot;
                        </p>
                    </div>
                </div>

                {/* Right Column: Key Metrics & Insights */}
                <div className="flex-1 flex flex-col justify-between gap-3">

                    {/* 1. Header: Health Score & Progress */}
                    <div className="space-y-1">
                        <div className="flex justify-between items-center mb-0.5">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Financial Health Score</span>
                            </div>
                            <span className={cn("text-2xl font-bold", scoreColor)}>{data.healthScore}<span className="text-sm text-muted-foreground font-medium">/100</span></span>
                        </div>
                        <Progress
                            value={data.healthScore}
                            className={cn("h-2.5 bg-secondary/50 rounded-full")}
                            indicator={cn(
                                "rounded-full transition-all duration-1000 ease-out",
                                data.healthScore >= 80
                                    ? "bg-emerald-500"
                                    : data.healthScore >= 50
                                        ? "bg-amber-500"
                                        : "bg-rose-500"
                            )}
                        />
                    </div>

                    {/* 2. Middle: Key Metrics (Compact) */}
                    <div className="grid grid-cols-3 gap-2 bg-background/40 p-2.5 rounded-xl border border-white/5 shadow-inner">
                        <div className="flex flex-col items-center justify-center gap-0.5">
                            <div className="p-1.5 rounded-full bg-emerald-500/10 text-emerald-500 mb-0.5">
                                <Target className="w-4 h-4" />
                            </div>
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Savings</span>
                            <span className="text-lg font-bold text-foreground">
                                {(data.metrics.savingsRate * 100).toFixed(0)}%
                            </span>
                        </div>

                        <div className="flex flex-col items-center justify-center gap-0.5 border-l border-border/40">
                            <div className="p-1.5 rounded-full bg-rose-500/10 text-rose-500 mb-0.5">
                                <TrendingDown className="w-4 h-4" />
                            </div>
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Luxury</span>
                            <span className="text-lg font-bold text-foreground">
                                {(data.metrics.luxuryRate * 100).toFixed(0)}%
                            </span>
                        </div>

                        <div className="flex flex-col items-center justify-center gap-0.5 border-l border-border/40">
                            <div className="p-1.5 rounded-full bg-blue-500/10 text-blue-500 mb-0.5">
                                <Wallet className="w-4 h-4" />
                            </div>
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Adherence</span>
                            <span className="text-lg font-bold text-foreground">
                                {(data.metrics.budgetAdherence * 100).toFixed(0)}%
                            </span>
                        </div>
                    </div>

                    {/* 3. Bottom: Insights List (Compact) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-auto">
                        {data.insights.slice(0, 2).map((insight, idx) => (
                            <div
                                key={idx}
                                className="flex items-start gap-2 text-[11px] text-foreground/90 bg-muted/40 hover:bg-muted/60 transition-colors p-2 rounded-lg border border-border/40"
                            >
                                <Zap className="h-3.5 w-3.5 mt-0.5 text-yellow-500 shrink-0 fill-yellow-500/20" />
                                <span className="line-clamp-2 leading-snug">{insight}</span>
                            </div>
                        ))}
                        {data.persona === "Peacock" && (
                            <div className="flex items-start gap-2 text-[11px] text-rose-600 bg-rose-50/50 dark:bg-rose-950/20 p-2 rounded-lg border border-rose-100 dark:border-rose-900/50">
                                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                <span className="leading-snug">High luxury spending detected. Review your wants vs needs.</span>
                            </div>
                        )}
                        {/* Fill empty space if few insights */}
                        {data.insights.length < 2 && (
                            <div className="hidden sm:flex items-center justify-center text-[10px] text-muted-foreground bg-transparent p-2 rounded-lg border border-dashed border-border/40">
                                <span>Keep tracking to unlock more insights</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Background Blob for aesthetics */}
            <div className={cn(
                "absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-10 pointer-events-none",
                config.bg.replace('/10', '/30')
            )} />
        </GlassCard>
    );
}
