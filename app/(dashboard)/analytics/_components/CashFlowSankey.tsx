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
    const textAnchor = isOut ? "end" : "start";
    const textX = isOut ? x - 6 : x + width + 6;

    return (
        <Layer key={`node-${index}`}>
            <Rectangle
                x={x}
                y={y}
                width={width}
                height={height}
                fill={COLORS[index % COLORS.length]}
                fillOpacity={0.8}
                rx={2}
            />
            <text
                x={textX}
                y={y + height / 2}
                fontSize="12"
                textAnchor={textAnchor}
                dominantBaseline="central"
                className="fill-foreground font-medium"
            >
                {payload.name}
            </text>
        </Layer>
    );
};

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-background/95 border p-2 rounded-lg shadow-xl backdrop-blur-sm">
                <p className="text-sm font-bold">{payload[0].payload.name || payload[0].name}</p>
                <p className="text-xs text-muted-foreground">
                    Value: <span className="text-foreground font-semibold">
                        {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "USD",
                        }).format(payload[0].value)}
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
        <Card className="col-span-1 md:col-span-12 overflow-hidden border-none bg-gradient-to-br from-card to-secondary/20 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                <div className="space-y-1">
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <ArrowRightLeft className="h-5 w-5 text-primary" />
                        Cash Flow Dynamics
                    </CardTitle>
                    <CardDescription>
                        Visualize how your money flows from income sources to expenses and savings
                    </CardDescription>
                </div>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-primary" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[400px] w-full mt-4">
                    {cashFlowQuery.isFetching ? (
                        <div className="flex flex-col space-y-3 h-full justify-center">
                            <Skeleton className="h-[300px] w-full rounded-xl" />
                        </div>
                    ) : !hasData ? (
                        <div className="flex h-full flex-col items-center justify-center text-center space-y-4">
                            <div className="rounded-full bg-muted p-6">
                                <ArrowRightLeft className="h-12 w-12 text-muted-foreground opacity-20" />
                            </div>
                            <p className="text-muted-foreground">
                                No cash flow data available for the selected period
                            </p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <Sankey
                                data={data}
                                node={<CustomNode />}
                                nodePadding={50}
                                margin={{ top: 20, left: 20, right: 120, bottom: 20 }}
                                link={{ stroke: "#3b82f6", strokeOpacity: 0.2 }}
                            >
                                <Tooltip content={<CustomTooltip />} />
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
