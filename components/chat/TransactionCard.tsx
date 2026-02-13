"use client";

import React from "react";
import { Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TransactionCardProps {
    data: {
        id: string;
        amount: number;
        description: string;
        category: string;
        categoryIcon?: string;
        type: "income" | "expense";
        date: string;
    };
    onSendSuggestion: (text: string) => void;
}

export const TransactionCard = ({ data, onSendSuggestion }: TransactionCardProps) => {
    return (
        <div className="mt-4 p-4 rounded-xl bg-card border border-border shadow-sm group animate-in zoom-in-95 duration-300">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-lg">
                        {data.categoryIcon || "💰"}
                    </div>
                    <div>
                        <h4 className="text-sm font-bold leading-none">{data.description}</h4>
                        <p className="text-[10px] text-muted-foreground mt-1">{data.category} • {data.date}</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className={cn(
                        "text-sm font-black",
                        data.type === "expense" ? "text-red-500" : "text-emerald-500"
                    )}>
                        {data.type === "expense" ? "-" : "+"}${data.amount}
                    </div>
                    <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-primary"
                            onClick={() => onSendSuggestion(`Edit transaction ${data.description}`)}
                        >
                            <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => onSendSuggestion(`Delete transaction ${data.description}`)}
                        >
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
