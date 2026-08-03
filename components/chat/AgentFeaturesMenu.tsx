"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sparkles,
    Bot,
    Mic,
    ShieldCheck,
    Trophy,
    BarChart3,
    CreditCard,
    Receipt,
    ChevronDown,
    ChevronUp,
    Zap,
    HelpCircle,
    ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface AgentFeatureItem {
    command: string;
    label: string;
    description: string;
    icon: React.ReactNode;
    badge?: string;
    badgeColor?: string;
    action?: string;
}

export const AGENT_FEATURES: AgentFeatureItem[] = [
    {
        command: "/chatbot",
        label: "AI Advisor Chat",
        description: "Ask finance questions & get persona-based recommendations.",
        icon: <Bot className="w-4 h-4 text-amber-500" />,
        badge: "Core",
        badgeColor: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    },
    {
        command: "/taxaudit",
        label: "Tax Auditor Agent",
        description: "Scans spending to discover write-offs & tax deduction tips.",
        icon: <ShieldCheck className="w-4 h-4 text-emerald-500" />,
        badge: "Workflow",
        badgeColor: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    },
    {
        command: "/review",
        label: "Monthly Spending Review",
        description: "Dual-agent analysis from Strict Accountant & Lifestyle Coach.",
        icon: <BarChart3 className="w-4 h-4 text-blue-500" />,
        badge: "Multi-Agent",
        badgeColor: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    },
    {
        command: "/challenge",
        label: "Wealth Challenge",
        description: "Start a 30-day gamified savings challenge to level up.",
        icon: <Trophy className="w-4 h-4 text-purple-500" />,
        badge: "Gamified",
        badgeColor: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    },
    {
        command: "/subscriptions",
        label: "Subscriptions Audit",
        description: "Detects recurring bills & flags unnecessary monthly costs.",
        icon: <CreditCard className="w-4 h-4 text-rose-500" />,
        badge: "Audit",
        badgeColor: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    },
    {
        command: "/drive",
        label: "Hands-free Voice Mode",
        description: "Toggle auto voice narration & speech recognition.",
        icon: <Mic className="w-4 h-4 text-cyan-500" />,
        badge: "Voice",
        badgeColor: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
    },
];

interface AgentFeaturesMenuProps {
    onSelectCommand: (command: string) => void;
    variant?: "dropdown" | "collapsible" | "bar";
    className?: string;
}

export function AgentFeaturesMenu({ onSelectCommand, variant = "dropdown", className }: AgentFeaturesMenuProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    if (variant === "dropdown") {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                            "h-8 text-xs font-semibold gap-1.5 border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl transition-all shadow-sm",
                            className
                        )}
                    >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                        <span>Agentic</span>
                        <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 sm:w-80 p-2 rounded-2xl shadow-xl border-border backdrop-blur-md">
                    <DropdownMenuLabel className="flex items-center justify-between text-xs font-bold text-muted-foreground px-2 py-1.5">
                        <span className="flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-amber-500" />
                            Agentic Workflows
                        </span>
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-amber-500/30 text-amber-500">
                            6 Workflows
                        </Badge>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup className="space-y-0.5 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                        {AGENT_FEATURES.map((feature) => (
                            <DropdownMenuItem
                                key={feature.command}
                                onClick={() => onSelectCommand(feature.command)}
                                className="flex items-start gap-2.5 p-2 rounded-xl cursor-pointer hover:bg-accent focus:bg-accent group transition-colors"
                            >
                                <div className="p-1.5 rounded-lg bg-secondary border border-border/50 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                                    {feature.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-1">
                                        <span className="font-semibold text-xs text-foreground group-hover:text-amber-500 transition-colors">
                                            {feature.label}
                                        </span>
                                        <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/40">
                                            {feature.command}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                                        {feature.description}
                                    </p>
                                </div>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <div className="p-2 text-[10px] text-muted-foreground flex items-center gap-1.5 bg-muted/40 rounded-xl mt-1">
                        <Receipt className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>Tip: You can also upload a receipt photo for automatic parsing!</span>
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    return (
        <div className={cn("rounded-2xl border border-border/80 bg-card/60 backdrop-blur-sm overflow-hidden transition-all shadow-sm", className)}>
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-3.5 py-2 flex items-center justify-between text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <span>Agentic Workflows & Instructions</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
                        Click to {isExpanded ? "hide" : "view"}
                    </Badge>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-border/60 p-3 bg-muted/20"
                    >
                        <p className="text-xs text-muted-foreground mb-2.5">
                            Select an agent workflow below or type the command directly in chat:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {AGENT_FEATURES.map((feature) => (
                                <button
                                    key={feature.command}
                                    type="button"
                                    onClick={() => onSelectCommand(feature.command)}
                                    className="flex items-center justify-between p-2 rounded-xl bg-background border border-border/70 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all text-left group"
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="p-1 rounded-md bg-secondary shrink-0">
                                            {feature.icon}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-xs font-medium text-foreground truncate group-hover:text-amber-500 transition-colors">
                                                {feature.label}
                                            </div>
                                            <div className="text-[10px] font-mono text-muted-foreground truncate">
                                                {feature.command}
                                            </div>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
