"use client";

import React from "react";
import { Wallet, Minus, Plus, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface BudgetAdjusterProps {
    data: {
        id: string;
        category: string;
        current: number;
        suggested?: number;
    };
}

export const BudgetAdjuster = ({ data }: BudgetAdjusterProps) => {
    const [localAmount, setLocalAmount] = React.useState(data.current || 0);
    const [isUpdating, setIsUpdating] = React.useState(false);

    const handleUpdate = async (newAmount: number) => {
        setIsUpdating(true);
        try {
            const response = await fetch(`/api/budgets?id=${data.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: newAmount }),
            });
            if (response.ok) {
                toast.success(`Budget for ${data.category} updated to ${newAmount}`);
                setLocalAmount(newAmount);
            } else {
                toast.error("Failed to update budget");
            }
        } catch (e) {
            toast.error("Error updating budget");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="mt-4 p-4 rounded-xl bg-card border border-border shadow-md animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-primary" />
                    <span className="text-sm font-bold">{data.category} Budget</span>
                </div>
                <span className="text-xs font-medium text-muted-foreground">Adjust Limit</span>
            </div>
            <div className="flex items-center justify-between gap-4 py-2">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => handleUpdate(localAmount - 50)}
                    disabled={isUpdating || localAmount <= 0}
                >
                    <Minus className="h-3 w-3" />
                </Button>
                <div className="flex flex-col items-center">
                    <span className="text-2xl font-black">${localAmount}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Target</span>
                </div>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => handleUpdate(localAmount + 50)}
                    disabled={isUpdating}
                >
                    <Plus className="h-3 w-3" />
                </Button>
            </div>
            <div className="mt-4 pt-3 border-t border-border flex justify-between items-center">
                <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    {data.suggested ? `AI Suggests: $${data.suggested}` : "Optimize your plan"}
                </div>
                {data.suggested && data.suggested !== localAmount && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-[10px] text-primary hover:text-primary-foreground hover:bg-primary"
                        onClick={() => handleUpdate(data.suggested || 0)}
                        disabled={isUpdating}
                    >
                        Apply Suggestion
                    </Button>
                )}
            </div>
        </div>
    );
};
