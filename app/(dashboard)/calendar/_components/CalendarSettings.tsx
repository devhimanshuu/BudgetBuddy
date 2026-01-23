"use client";

import React from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

interface CalendarSettingsProps {
    multiplier: number;
    onMultiplierChange: (value: number) => void;
}

const MULTIPLIER_OPTIONS = [
    { value: 1.2, label: "1.2x - Very Lenient", description: "Flag only extreme overspending" },
    { value: 1.5, label: "1.5x - Balanced (Default)", description: "Moderate spending alerts" },
    { value: 2.0, label: "2.0x - Strict", description: "Flag significant overspending" },
    { value: 2.5, label: "2.5x - Very Strict", description: "Only major overspending" },
    { value: 3.0, label: "3.0x - Extremely Strict", description: "Rare high spending alerts" },
];

export default function CalendarSettings({
    multiplier,
    onMultiplierChange,
}: CalendarSettingsProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Settings className="h-5 w-5" />
                    Calendar Settings
                </CardTitle>
                <CardDescription>
                    Customize how high spending days are identified
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <label className="text-sm font-medium">High Spending Threshold</label>
                    <Select
                        value={multiplier.toString()}
                        onValueChange={(value) => onMultiplierChange(parseFloat(value))}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select threshold" />
                        </SelectTrigger>
                        <SelectContent>
                            {MULTIPLIER_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value.toString()}>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{option.label}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {option.description}
                                        </span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                        Days with expenses exceeding {multiplier}x your average daily spending will be
                        marked with a red dot
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
