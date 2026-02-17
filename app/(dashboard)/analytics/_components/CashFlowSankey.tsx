"use client";

import React from "react";
import {
    ResponsiveContainer,
    Sankey,
    Tooltip,
    Layer,
    Rectangle,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, ArrowRightLeft } from "lucide-react";

interface CashFlowSankeyProps {
    from: Date;
    to: Date;
    isPrivacyMode: boolean;
}

const COLORS = [
    "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
    "#ec4899", "#06b6d4", "#f97316", "#14b8a6", "#6366f1"
];

const CustomNode = (props: any) => {
    const { x, y, width, height, index, payload, containerWidth } = props;
    const isOut = x > containerWidth / 2;
    const isRightEdge = x > containerWidth - 150;

    // Color based on type
    let fill = COLORS[index % COLORS.length];
    if (payload.type === "inflow") fill = "#10b981"; // Emerald
    else if (payload.type === "pipeline") fill = "#3b82f6"; // Blue
    else if (payload.type === "outflow") fill = "#ef4444"; // Red

    const isLeftEdge = x < 150;
    const textAnchor = isLeftEdge ? "start" : "end";
    const textX = isLeftEdge ? x + width + 10 : x - 10;

    return (
        <Layer key={`node-${index}`}>
            <Rectangle
                x={x}
                y={y}
                width={width}
                height={Math.max(height, 2)}
                fill={fill}
                fillOpacity={0.8}
                rx={4}
            />
            <text
                x={textX}
                y={y + height / 2}
                fontSize="12"
                textAnchor={textAnchor}
                dominantBaseline="central"
                className="fill-foreground font-semibold"
            >
                {payload.name}
            </text>
        </Layer>
    );
};

const CustomTooltip = ({ active, payload, isPrivacyMode }: any) => {
    if (active && payload && payload.length) {
        const isLink = !!payload[0].payload.source;
        return (
            <div className="bg-background/95 border p-3 rounded-xl shadow-2xl backdrop-blur-md border-primary/20 min-w-[150px]">
                <p className="text-sm font-bold flex items-center gap-2">
                    {isLink ? (
                        <>
                            <span className="text-muted-foreground">{payload[0].payload.source.name}</span>
                            <ArrowRightLeft className="h-3 w-3" />
                            <span>{payload[0].payload.target.name}</span>
                        </>
                    ) : (
                        payload[0].payload.name || payload[0].name
                    )}
                </p>
                <p className="text-xs mt-1">
                    <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold">Amount</span>
                    <br />
                    <span className="text-lg font-black text-primary">
                        {isPrivacyMode ? (
                            "••••••"
                        ) : (
                            new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: "USD",
                            }).format(payload[0].value)
                        )}
                    </span>
                </p>
            </div>
        );
    }
    return null;
};

export default function CashFlowSankey({ from, to, isPrivacyMode }: CashFlowSankeyProps) {
    const cashFlowQuery = useQuery({
        queryKey: ["analytics", "cashflow", from, to],
        queryFn: () =>
            fetch(`/api/analytics/cashflow?from=${from.toISOString()}&to=${to.toISOString()}`).then(
                (res) => res.json()
            ),
    });

    const data = cashFlowQuery.data;
    const hasData = data && data.nodes && data.nodes.length > 0;

    return (
        <Card className="col-span-1 md:col-span-12 overflow-hidden border border-border/50 bg-card/50 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                <div className="space-y-1">
                    <CardTitle className="text-2xl font-black flex items-center gap-2 tracking-tight">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mr-1">
                            <ArrowRightLeft className="h-6 w-6 text-primary" />
                        </div>
                        Cash Flow Dynamics
                    </CardTitle>
                    <CardDescription className="text-sm font-medium opacity-70">
                        Visualize how your money flows from income sources to expenses and savings
                    </CardDescription>
                </div>
                <div className="flex gap-2">
                    <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20">
                        Live Flow
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[500px] w-full mt-4">
                    {cashFlowQuery.isFetching ? (
                        <div className="flex flex-col space-y-3 h-full justify-center">
                            <Skeleton className="h-[400px] w-full rounded-2xl" />
                        </div>
                    ) : !hasData ? (
                        <div className="flex h-full flex-col items-center justify-center text-center space-y-4">
                            <div className="rounded-full bg-muted/30 p-8 border border-dashed border-muted-foreground/20">
                                <ArrowRightLeft className="h-16 w-16 text-muted-foreground opacity-20" />
                            </div>
                            <p className="text-muted-foreground font-medium">
                                No cash flow data available for the selected period
                            </p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <Sankey
                                data={data}
                                node={<CustomNode />}
                                nodePadding={data.nodes.length > 10 ? 20 : 40}
                                margin={{ top: 40, left: 20, right: 20, bottom: 40 }}
                                link={{
                                    stroke: "#3b82f6",
                                    strokeOpacity: 0.4,
                                    fill: "none"
                                }}
                                iterations={64}
                            >
                                <Tooltip content={<CustomTooltip isPrivacyMode={isPrivacyMode} />} />
                            </Sankey>
                        </ResponsiveContainer>
                    )}
                </div>

                {hasData && !isPrivacyMode && (
                    <div className="mt-6 flex flex-wrap gap-4 justify-center">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground border-r pr-4">
                            <div className="w-3 h-3 rounded-full bg-emerald-500" />
                            <span>Inflow</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground border-r pr-4">
                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                            <span>Pipeline</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <span>Outflow</span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
