"use client";

import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, BarChart3, LineChart, Sparkles, Trash2, Edit2, Plus, Minus, Check, Calendar, Tag, CreditCard, Wallet, ArrowUpCircle, ArrowDownCircle, PieChart, Info, History, AlertTriangle, Target, Zap, Waves, Flame, Award, Trophy } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";
import { extractBalancedJson } from "./utils";
import { BudgetAdjuster } from "./BudgetAdjuster";
import { TransactionCard } from "./TransactionCard";

interface LivingUIRendererProps {
    text: string;
    onSendSuggestion: (text: string) => void;
}

export const LivingUIRenderer = ({ text, onSendSuggestion }: LivingUIRendererProps) => {
    const components: React.ReactNode[] = [];

    // Match [PROGRESS_BAR: {...}]
    const progressBarRegex = /\[PROGRESS_BAR:\s*({[\s\S]*?})\s*\]/g;
    let match;
    while ((match = progressBarRegex.exec(text)) !== null) {
        try {
            const jsonStr = match[1].trim();
            if (!jsonStr.endsWith("}")) continue;
            const data = JSON.parse(jsonStr);
            components.push(
                <div key={`pb-${match.index}`} className="mt-4 p-3 rounded-lg bg-background/50 border border-border shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold">{data.label}</span>
                        <span className="text-[10px] text-muted-foreground">{((data.current / data.target) * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={(data.current / data.target) * 100} className={cn("h-1.5", data.color === "orange" ? "bg-orange-500/20" : "")} />
                    <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                        <span>{data.current} spent</span>
                        <span>{data.target} budget</span>
                    </div>
                </div>
            );
        } catch (e) { /* silent */ }
    }

    // Match [MINI_TREND: {...}]
    const trendRegex = /\[MINI_TREND:\s*({[\s\S]*?})\s*\]/g;
    while ((match = trendRegex.exec(text)) !== null) {
        try {
            const jsonStr = match[1].trim();
            if (!jsonStr.endsWith("}")) continue;
            const data = JSON.parse(jsonStr);
            components.push(
                <div key={`trend-${match.index}`} className="mt-4 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 shadow-sm flex items-center gap-3">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    <div className="flex-1">
                        <p className="text-xs font-semibold text-emerald-600">{data.label}</p>
                        <div className="flex items-end gap-0.5 h-6 mt-1">
                            {data.data.map((v: number, i: number) => (
                                <div key={i} className="flex-1 bg-emerald-400/50 rounded-t-sm" style={{ height: `${(v / Math.max(...data.data)) * 100}%` }} />
                            ))}
                        </div>
                    </div>
                </div>
            );
        } catch (e) { /* silent */ }
    }

    // Match [BAR_CHART: {...}]
    const barChartMatches = extractBalancedJson(text, 'BAR_CHART');
    for (const barMatch of barChartMatches) {
        try {
            let jsonStr = barMatch.json.trim();
            if (jsonStr.includes("'") && !jsonStr.includes('"')) {
                jsonStr = jsonStr.replace(/'/g, '"');
            }
            const data = JSON.parse(jsonStr);
            const chartData = Array.isArray(data) ? data : (data.data || []);
            if (!Array.isArray(chartData) || chartData.length === 0) continue;

            const matchIndex = barMatch.index;
            const maxValue = Math.max(...chartData.map((d: any) => Number(d.value || d.amount || 0)), 1);
            const barGradients = [
                'linear-gradient(to top, #7c3aed, #a855f7)',
                'linear-gradient(to top, #3b82f6, #22d3ee)',
                'linear-gradient(to top, #16a34a, #34d399)',
                'linear-gradient(to top, #ea580c, #fbbf24)',
                'linear-gradient(to top, #e11d48, #fb7185)',
                'linear-gradient(to top, #4f46e5, #818cf8)',
                'linear-gradient(to top, #0d9488, #2dd4bf)',
                'linear-gradient(to top, #c026d3, #e879f9)',
                'linear-gradient(to top, #65a30d, #a3e635)',
                'linear-gradient(to top, #dc2626, #f87171)',
            ];
            components.push(
                <div key={`bar-${matchIndex}`} className="mt-4 p-4 rounded-xl bg-card border border-border shadow-md animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="flex items-center gap-2 mb-4">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        <span className="text-sm font-bold tracking-tight">{data.title || "Financial Breakdown"}</span>
                    </div>
                    <div className="flex items-end gap-2 px-1" style={{ height: '160px' }}>
                        {chartData.map((item: any, i: number) => {
                            const label = item.label || item.name || item.category || item.date || `Item ${i + 1}`;
                            const value = Number(item.value || item.amount || 0);
                            const barHeight = Math.max((value / maxValue) * 128, 4);
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group">
                                    <span className="text-[9px] font-semibold text-muted-foreground mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toFixed(0)}
                                    </span>
                                    <div
                                        className="w-full max-w-[40px] rounded-t-md transition-all duration-700 ease-out group-hover:opacity-90 shadow-sm"
                                        style={{ height: `${barHeight}px`, background: barGradients[i % barGradients.length] }}
                                    />
                                    <span className="text-[9px] font-medium text-muted-foreground truncate w-full text-center mt-1.5 group-hover:text-foreground transition-colors">
                                        {label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        } catch (e: any) { /* silent */ }
    }

    // Match [PIE_CHART: {...}]
    const pieChartMatches = extractBalancedJson(text, 'PIE_CHART');
    for (const pieMatch of pieChartMatches) {
        try {
            const data = JSON.parse(pieMatch.json.trim());
            const chartData = Array.isArray(data) ? data : (data.data || []);
            if (!Array.isArray(chartData) || chartData.length === 0) continue;

            const total = chartData.reduce((sum: number, item: any) => sum + Number(item.value || 0), 0);
            let currentAngle = -90;
            const pieColors = ['#7c3aed', '#3b82f6', '#16a34a', '#ea580c', '#e11d48', '#4f46e5', '#0d9488', '#c026d3', '#65a30d', '#dc2626'];

            components.push(
                <div key={`pie-${pieMatch.index}`} className="mt-4 p-4 rounded-xl bg-card border border-border shadow-md animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-4 w-4 rounded-full bg-gradient-to-br from-violet-500 to-purple-600" />
                        <span className="text-sm font-bold tracking-tight">{data.title || "Distribution"}</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <svg width="140" height="140" viewBox="0 0 140 140" className="shrink-0">
                            <circle cx="70" cy="70" r="60" fill="none" stroke="hsl(var(--border))" strokeWidth="20" opacity="0.1" />
                            {chartData.map((item: any, i: number) => {
                                const value = Number(item.value || 0);
                                const percentage = (value / total) * 100;
                                const angle = (percentage / 100) * 360;
                                const startAngle = currentAngle;
                                currentAngle += angle;
                                const startRad = (startAngle * Math.PI) / 180;
                                const endRad = (currentAngle * Math.PI) / 180;
                                const x1 = 70 + 60 * Math.cos(startRad);
                                const y1 = 70 + 60 * Math.sin(startRad);
                                const x2 = 70 + 60 * Math.cos(endRad);
                                const y2 = 70 + 60 * Math.sin(endRad);
                                const largeArc = angle > 180 ? 1 : 0;
                                return (
                                    <motion.path
                                        key={i}
                                        initial={{ pathLength: 0, opacity: 0 }}
                                        animate={{ pathLength: 1, opacity: 1 }}
                                        transition={{ duration: 1, delay: i * 0.1, ease: "easeOut" }}
                                        d={`M 70 70 L ${x1} ${y1} A 60 60 0 ${largeArc} 1 ${x2} ${y2} Z`}
                                        fill={item.color || pieColors[i % pieColors.length]}
                                        stroke="hsl(var(--card))"
                                        strokeWidth="2"
                                        className="hover:opacity-80 transition-opacity cursor-pointer"
                                    />
                                );
                            })}
                            <circle cx="70" cy="70" r="35" fill="hsl(var(--card))" />
                        </svg>
                        <div className="flex-1 space-y-2">
                            {chartData.map((item: any, i: number) => {
                                const value = Number(item.value || 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return (
                                    <div key={i} className="flex items-center justify-between gap-3 group">
                                        <div className="flex items-center gap-2 flex-1">
                                            <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: item.color || pieColors[i % pieColors.length] }} />
                                            <span className="text-xs font-medium truncate">{item.label}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold">{percentage}%</span>
                                            <span className="text-[10px] text-muted-foreground">{value.toFixed(0)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            );
        } catch (e: any) { /* silent */ }
    }

    // Match [COMPARISON: {...}]
    const comparisonMatches = extractBalancedJson(text, 'COMPARISON');
    for (const compMatch of comparisonMatches) {
        try {
            const data = JSON.parse(compMatch.json.trim());
            const current = Number(data.current || 0);
            const previous = Number(data.previous || 0);
            const change = current - previous;
            const percentChange = previous !== 0 ? ((change / previous) * 100) : 0;
            const isIncrease = change > 0;
            const isDecrease = change < 0;

            components.push(
                <div key={`comp-${compMatch.index}`} className="mt-4 p-4 rounded-xl bg-card border border-border shadow-md animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold">{data.label || "Comparison"}</span>
                        <span className="text-[10px] text-muted-foreground">{data.period || "vs Previous"}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <div className="text-[10px] text-muted-foreground mb-1">Current</div>
                            <div className="text-2xl font-bold">{current.toFixed(0)}</div>
                        </div>
                        <div className={cn(
                            "flex flex-col items-center justify-center px-4 py-2 rounded-lg",
                            isIncrease && "bg-red-500/10",
                            isDecrease && "bg-emerald-500/10",
                            !isIncrease && !isDecrease && "bg-muted"
                        )}>
                            <div className="flex items-center gap-1">
                                {isIncrease && <TrendingUp className="h-4 w-4 text-red-500" />}
                                {isDecrease && <TrendingUp className="h-4 w-4 text-emerald-500 rotate-180" />}
                                <span className={cn("text-sm font-bold", isIncrease && "text-red-500", isDecrease && "text-emerald-500")}>
                                    {Math.abs(percentChange).toFixed(1)}%
                                </span>
                            </div>
                            <span className={cn("text-[9px] font-medium", isIncrease && "text-red-600", isDecrease && "text-emerald-600", !isIncrease && !isDecrease && "text-muted-foreground")}>
                                {isIncrease ? "more" : isDecrease ? "less" : "same"}
                            </span>
                        </div>
                        <div className="flex-1 text-right">
                            <div className="text-[10px] text-muted-foreground mb-1">Previous</div>
                            <div className="text-2xl font-bold text-muted-foreground/60">{previous.toFixed(0)}</div>
                        </div>
                    </div>
                </div>
            );
        } catch (e: any) { /* silent */ }
    }

    // Match [HEATMAP: {...}]
    const heatmapMatches = extractBalancedJson(text, 'HEATMAP');
    for (const heatMatch of heatmapMatches) {
        try {
            const data = JSON.parse(heatMatch.json.trim());
            const heatmapData = data.data || {};
            const dates = Object.keys(heatmapData).sort();
            if (dates.length === 0) continue;

            const endDate = new Date(dates[dates.length - 1] || new Date());
            const startDate = new Date(endDate);
            startDate.setDate(startDate.getDate() - 83);

            const weeks: Date[][] = [];
            let currentWeek: Date[] = [];
            const current = new Date(startDate);
            while (current.getDay() !== 0) current.setDate(current.getDate() - 1);
            while (current <= endDate) {
                currentWeek.push(new Date(current));
                if (current.getDay() === 6) {
                    weeks.push(currentWeek);
                    currentWeek = [];
                }
                current.setDate(current.getDate() + 1);
            }
            if (currentWeek.length > 0) weeks.push(currentWeek);

            const maxValue = Math.max(...Object.values(heatmapData).map(v => Number(v)), 1);

            components.push(
                <div key={`heat-${heatMatch.index}`} className="mt-4 p-4 rounded-xl bg-card border border-border shadow-md animate-in fade-in slide-in-from-bottom-2 duration-500 overflow-x-auto">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-4 w-4 rounded bg-gradient-to-br from-emerald-400 to-green-600" />
                        <span className="text-sm font-bold tracking-tight">{data.title || "Activity Heatmap"}</span>
                    </div>
                    <div className="flex gap-1">
                        <div className="flex flex-col gap-1 text-[8px] text-muted-foreground pr-1">
                            <div style={{ height: '12px' }}>Sun</div><div style={{ height: '12px' }}></div>
                            <div style={{ height: '12px' }}>Tue</div><div style={{ height: '12px' }}></div>
                            <div style={{ height: '12px' }}>Thu</div><div style={{ height: '12px' }}></div>
                            <div style={{ height: '12px' }}>Sat</div>
                        </div>
                        <div className="flex gap-1">
                            {weeks.map((week, weekIdx) => (
                                <div key={weekIdx} className="flex flex-col gap-1">
                                    {week.map((date, dayIdx) => {
                                        const dateStr = date.toISOString().split('T')[0];
                                        const value = Number(heatmapData[dateStr] || 0);
                                        const intensity = value > 0 ? Math.min((value / maxValue) * 4, 4) : 0;
                                        const colors = ['hsl(var(--muted))', '#d1fae5', '#6ee7b7', '#34d399', '#10b981'];
                                        return (
                                            <motion.div
                                                key={dayIdx}
                                                initial={{ scale: 0, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                transition={{ delay: weekIdx * 0.02 + dayIdx * 0.01 }}
                                                className="w-3 h-3 rounded-sm group relative cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                                                style={{ background: colors[Math.floor(intensity)] }}
                                            >
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-[9px] rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 border border-border">
                                                    {dateStr}<br />{value.toFixed(0)}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3 text-[9px] text-muted-foreground">
                        <span>Less</span>
                        <div className="flex gap-1">
                            {[0, 1, 2, 3, 4].map(i => <div key={i} className="w-3 h-3 rounded-sm" style={{ background: ['hsl(var(--muted))', '#d1fae5', '#6ee7b7', '#34d399', '#10b981'][i] }} />)}
                        </div>
                        <span>More</span>
                    </div>
                </div>
            );
        } catch (e: any) { /* silent */ }
    }

    // Match [LINE_CHART: {...}]
    const lineChartRegex = /\[LINE_CHART:\s*({[\s\S]*?})\s*\]/g;
    while ((match = lineChartRegex.exec(text)) !== null) {
        try {
            const data = JSON.parse(match[1].trim());
            const points = data.data || [];
            const labels = data.labels || [];
            const max = Math.max(...points, 1);
            const width = 300, height = 100, step = width / (points.length - 1);
            const pathData = points.map((p: number, i: number) => `${i === 0 ? 'M' : 'L'} ${i * step} ${height - (p / max) * height}`).join(' ');

            components.push(
                <div key={`line-${match.index}`} className="mt-4 p-4 rounded-xl bg-gradient-to-br from-card to-secondary/30 border border-border shadow-md overflow-hidden animate-in zoom-in-95 duration-500">
                    <div className="flex items-center gap-2 mb-4">
                        <LineChart className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm font-bold">{data.title || "Trend Analysis"}</span>
                    </div>
                    <div className="relative h-28 w-full mt-2">
                        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                            <defs>
                                <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" /><stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <motion.path
                                initial={{ d: `M 0 ${height} L ${width} ${height} L ${width} ${height} L 0 ${height} Z` }}
                                animate={{ d: `${pathData} L ${width} ${height} L 0 ${height} Z` }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                fill="url(#lineGradient)"
                            />
                            <motion.path
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 1.5, ease: "easeInOut" }}
                                d={pathData}
                                fill="none"
                                stroke="#10b981"
                                strokeWidth="3"
                                strokeLinecap="round"
                            />
                        </svg>
                    </div>
                    <div className="flex justify-between mt-2">
                        {labels.map((l: string, i: number) => <span key={i} className="text-[10px] text-muted-foreground font-medium">{l}</span>)}
                    </div>
                </div>
            );
        } catch (e) { /* silent */ }
    }

    // Match [BUDGET_ADJUSTER: {...}]
    const budgetAdjusterMatches = extractBalancedJson(text, 'BUDGET_ADJUSTER');
    for (const budgetMatch of budgetAdjusterMatches) {
        try {
            const data = JSON.parse(budgetMatch.json.trim());
            components.push(
                <BudgetAdjuster key={`budget-adj-${budgetMatch.index}`} data={data} />
            );
        } catch (e) { /* silent */ }
    }

    // Match [TRANSACTION_CARD: {...}]
    const transactionCardMatches = extractBalancedJson(text, 'TRANSACTION_CARD');
    for (const txMatch of transactionCardMatches) {
        try {
            const data = JSON.parse(txMatch.json.trim());
            components.push(
                <TransactionCard key={`tx-card-${txMatch.index}`} data={data} onSendSuggestion={onSendSuggestion} />
            );
        } catch (e) { /* silent */ }
    }

    // Match [ALERT: {...}]
    const alertMatches = extractBalancedJson(text, 'ALERT');
    for (const alertMatch of alertMatches) {
        try {
            const data = JSON.parse(alertMatch.json.trim());
            const isWarning = data.type === 'warning';
            const isDanger = data.type === 'danger';

            components.push(
                <div key={`alert-${alertMatch.index}`} className={cn(
                    "mt-4 p-4 rounded-xl border animate-in slide-in-from-left-2 duration-500",
                    isWarning && "bg-amber-500/10 border-amber-500/20 text-amber-900 dark:text-amber-200",
                    isDanger && "bg-red-500/10 border-red-500/20 text-red-900 dark:text-red-200",
                    !isWarning && !isDanger && "bg-blue-500/10 border-blue-500/20 text-blue-900 dark:text-blue-200"
                )}>
                    <div className="flex gap-3">
                        {isWarning || isDanger ? <AlertTriangle className="h-5 w-5 shrink-0" /> : <Info className="h-5 w-5 shrink-0" />}
                        <div>
                            <p className="text-sm font-bold">{data.title || (isDanger ? "Urgent Alert" : "Spending Insight")}</p>
                            <p className="text-xs mt-1 opacity-90">{data.message}</p>
                            {data.amount && (
                                <div className="mt-2 text-lg font-black tracking-tight">
                                    ${data.amount.toFixed(2)}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            );
        } catch (e) { /* silent */ }
    }

    // Match [GOAL_PROGRESS: {...}]
    const goalProgressMatches = extractBalancedJson(text, 'GOAL_PROGRESS');
    for (const gpMatch of goalProgressMatches) {
        try {
            const data = JSON.parse(gpMatch.json.trim());
            const percentage = Math.min((data.current / data.target) * 100, 100);

            components.push(
                <div key={`gp-${gpMatch.index}`} className="mt-4 p-4 rounded-xl bg-card border border-border shadow-md animate-in zoom-in-95 duration-500">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-primary" />
                            <span className="text-sm font-bold">{data.name}</span>
                        </div>
                        <span className="text-xs font-bold text-primary">{percentage.toFixed(0)}%</span>
                    </div>

                    <div className="relative h-4 w-full bg-secondary rounded-full overflow-hidden mb-2">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-primary"
                        />
                        {data.milestones?.map((m: number, i: number) => {
                            const mPos = (m / data.target) * 100;
                            if (mPos >= 100) return null;
                            return (
                                <div
                                    key={i}
                                    className="absolute top-0 bottom-0 w-0.5 bg-background/30"
                                    style={{ left: `${mPos}%` }}
                                />
                            );
                        })}
                    </div>

                    <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                        <span>Current: ${data.current}</span>
                        <span>Target: ${data.target}</span>
                    </div>

                    {percentage >= 100 && (
                        <div className="mt-3 flex items-center gap-2 text-[10px] text-emerald-500 font-bold bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                            <Sparkles className="h-3 w-3" />
                            Goal Completed! You&apos;re amazing!
                        </div>
                    )}
                </div>
            );
        } catch (e) { /* silent */ }
    }

    // Match [FORECAST: {...}]
    const forecastMatches = extractBalancedJson(text, 'FORECAST');
    for (const fcMatch of forecastMatches) {
        try {
            const data = JSON.parse(fcMatch.json.trim());
            const isOver = data.projected > data.budget;

            components.push(
                <div key={`fc-${fcMatch.index}`} className="mt-4 p-4 rounded-xl bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border border-primary/20 shadow-md animate-in fade-in duration-700">
                    <div className="flex items-center gap-2 mb-4">
                        <Zap className="h-4 w-4 text-amber-500" />
                        <span className="text-sm font-bold tracking-tight">{data.category} Forecast</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Projected</p>
                            <p className={cn("text-xl font-black mt-0.5", isOver ? "text-red-500" : "text-emerald-500")}>
                                ${data.projected.toFixed(0)}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Budget</p>
                            <p className="text-xl font-black mt-0.5">${data.budget.toFixed(0)}</p>
                        </div>
                    </div>

                    <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between text-[10px]">
                            <span className="text-muted-foreground">Confidence Score</span>
                            <span className="font-bold">{((data.confidence || 0.8) * 100).toFixed(0)}%</span>
                        </div>
                        <Progress value={(data.confidence || 0.8) * 100} className="h-1 bg-primary/10" />
                    </div>

                    {isOver && (
                        <div className="mt-4 p-2 rounded-lg bg-red-500/5 border border-red-500/10 text-[10px] text-red-600 font-medium">
                            Warning: You might exceed your budget by ${Math.abs(data.projected - data.budget).toFixed(0)}.
                        </div>
                    )}
                </div>
            );
        } catch (e) { /* silent */ }
    }
    // Match [STREAK: {...}]
    const streakMatches = extractBalancedJson(text, 'STREAK');
    for (const streakMatch of streakMatches) {
        try {
            const data = JSON.parse(streakMatch.json.trim());
            components.push(
                <div key={`streak-${streakMatch.index}`} className="mt-4 p-5 rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 shadow-lg relative overflow-hidden group animate-in zoom-in-95 duration-500">
                    <div className="absolute top-[-20px] right-[-20px] opacity-10 group-hover:scale-110 transition-transform duration-1000">
                        <Flame className="w-32 h-32 text-orange-500" />
                    </div>
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex flex-col items-center justify-center shadow-xl shadow-orange-500/20">
                            <span className="text-2xl font-black text-white leading-none">{data.days}</span>
                            <span className="text-[10px] font-bold text-white/80 uppercase tracking-tighter mt-1">Days</span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <Flame className="h-4 w-4 text-orange-500 animate-pulse" />
                                <h4 className="text-sm font-black uppercase tracking-tight text-orange-600">Unstoppable Streak!</h4>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">You&apos;ve hit {data.days} consecutive days of {data.type.replace('_', ' ')}.</p>
                            <div className="mt-2 flex items-center gap-1.5 bg-orange-500/5 px-2 py-1 rounded-full border border-orange-500/10 w-fit">
                                <span className="text-xs">{data.reward || "🔥"}</span>
                                <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Level Up</span>
                            </div>
                        </div>
                    </div>
                </div>
            );
        } catch (e) { /* silent */ }
    }

    // Match [ACHIEVEMENT: {...}]
    const achievementMatches = extractBalancedJson(text, 'ACHIEVEMENT');
    for (const achMatch of achievementMatches) {
        try {
            const data = JSON.parse(achMatch.json.trim());

            // Trigger confetti on render
            if (typeof window !== 'undefined') {
                setTimeout(() => {
                    confetti({
                        particleCount: 100,
                        spread: 70,
                        origin: { y: 0.6 },
                        colors: ['#fbbf24', '#f59e0b', '#fb923c', '#d97706']
                    });
                }, 500);
            }

            components.push(
                <div key={`ach-${achMatch.index}`} className="mt-4 p-5 rounded-2xl bg-gradient-to-br from-amber-400/10 to-yellow-600/10 border border-amber-400/30 shadow-xl relative overflow-hidden group animate-in scale-90 fade-in duration-700">
                    <div className="absolute -top-6 -left-6 opacity-10 rotate-12">
                        <Trophy className="w-24 h-24 text-amber-500" />
                    </div>
                    <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-600 flex items-center justify-center shadow-lg mb-3">
                            <Award className="h-7 w-7 text-white" />
                        </div>
                        <h4 className="text-lg font-black text-amber-600 tracking-tight">Achievement Unlocked!</h4>
                        <p className="text-sm font-bold mt-1">{data.name}</p>
                        <p className="text-xs text-muted-foreground mt-1 px-4">{data.description}</p>
                        <div className="mt-4 px-4 py-1.5 rounded-full bg-amber-400 text-white text-[10px] font-black uppercase tracking-widest shadow-md">
                            +{data.points || 50} BB Points
                        </div>
                    </div>
                </div>
            );
        } catch (e) { /* silent */ }
    }

    // Match [RECAP: {...}]
    const recapMatches = extractBalancedJson(text, 'RECAP');
    for (const recapMatch of recapMatches) {
        try {
            const data = JSON.parse(recapMatch.json.trim());
            components.push(
                <div key={`recap-${recapMatch.index}`} className="mt-4 p-5 rounded-2xl bg-card border border-primary/20 shadow-xl animate-in slide-in-from-bottom-5 duration-700">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black tracking-tight">{data.period} Summary</h4>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none mt-1">Budget Recap</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {data.stats.map((stat: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50 border border-border/50">
                                <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
                                <span className={cn(
                                    "text-sm font-black",
                                    stat.trend === 'up' ? "text-emerald-500" : stat.trend === 'down' ? "text-red-500" : ""
                                )}>
                                    {stat.value}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/10">
                        <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="h-3 w-3 text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Budget Buddy Tip</span>
                        </div>
                        <p className="text-xs italic text-muted-foreground">&quot;{data.tip}&quot;</p>
                    </div>
                </div>
            );
        } catch (e) { /* silent */ }
    }

    // Match [SUGGESTIONS: [...]]
    const suggestionRegex = /\[SUGGESTIONS:\s*(\[[\s\S]*?\])\s*\]/g;
    while ((match = suggestionRegex.exec(text)) !== null) {
        try {
            const suggestions = JSON.parse(match[1].trim());

            // Icon mapping for common suggestion types
            const getIcon = (text: string) => {
                const lowerText = text.toLowerCase();
                if (lowerText.includes("spend") || lowerText.includes("expense") || lowerText.includes("breakdown")) return <PieChart className="h-3 w-3" />;
                if (lowerText.includes("trend") || lowerText.includes("compare") || lowerText.includes("history")) return <TrendingUp className="h-3 w-3" />;
                if (lowerText.includes("budget") || lowerText.includes("limit") || lowerText.includes("adjust")) return <Wallet className="h-3 w-3" />;
                if (lowerText.includes("track") || lowerText.includes("add") || lowerText.includes("log")) return <Plus className="h-3 w-3" />;
                if (lowerText.includes("search") || lowerText.includes("find") || lowerText.includes("filter")) return <Tag className="h-3 w-3" />;
                if (lowerText.includes("receipt") || lowerText.includes("scan")) return <Calendar className="h-3 w-3" />;
                return <Sparkles className="h-3 w-3" />;
            };

            components.push(
                <div key={`sug-${match.index}`} className="mt-4 flex flex-wrap gap-2">
                    {suggestions.map((s: string, i: number) => (
                        <button
                            key={i}
                            onClick={() => onSendSuggestion(s)}
                            className="text-xs px-3 py-1.5 rounded-full bg-primary/5 hover:bg-primary/20 border border-primary/20 transition-all hover:scale-105 active:scale-95 text-primary font-medium flex items-center gap-1.5 shadow-sm"
                        >
                            {getIcon(s)}
                            {s}
                        </button>
                    ))}
                </div>
            );
        } catch (e) { /* silent */ }
    }

    return <>{components}</>;
};
