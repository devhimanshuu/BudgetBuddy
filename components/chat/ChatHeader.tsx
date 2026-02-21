"use client";

import React from "react";
import { motion } from "framer-motion";
import { PiggyBank, Trash2, Minimize2, Maximize2, X, FileDown, Download, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { PERSONA_THEME, PersonaType } from "@/lib/persona";

interface ChatHeaderProps {
    isMinimized: boolean;
    isExpanded: boolean;
    userPersona: string | null;
    history: any[];
    isAutoSpeak: boolean;
    onToggleAutoSpeak: () => void;
    onToggleMinimize: () => void;
    onToggleExpand: () => void;
    onClearHistory: () => void;
}

export const ChatHeader = ({
    isMinimized,
    isExpanded,
    userPersona,
    history,
    isAutoSpeak,
    onToggleAutoSpeak,
    onToggleMinimize,
    onToggleExpand,
    onClearHistory,
}: ChatHeaderProps) => {

    const handleExportPDF = () => {
        const doc = new jsPDF();
        const date = format(new Date(), "PPpp");

        // Header
        doc.setFontSize(22);
        doc.setTextColor(245, 158, 11); // Amber
        doc.text("Budget Buddy AI Report", 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${date}`, 14, 28);
        doc.text(`Persona: ${userPersona || "Standard"}`, 14, 33);

        // Content
        const tableData = history.map((msg: any) => [
            msg.role === "user" ? "You" : "Budget Buddy",
            msg.parts.map((p: any) => p.text).join("\n").replace(/\[.*?\]/g, "").trim()
        ]).filter(row => row[1] !== "");

        autoTable(doc, {
            startY: 40,
            head: [['Sender', 'Message']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [245, 158, 11] },
            styles: { fontSize: 9, cellPadding: 5 },
            columnStyles: {
                0: { cellWidth: 30, fontStyle: 'bold' },
                1: { cellWidth: 'auto' }
            }
        });

        doc.save(`BudgetBuddy_Report_${format(new Date(), "yyyy-MM-dd")}.pdf`);
    };
    return (
        <div className={cn(
            "p-4 border-b border-border flex items-center justify-between bg-primary/5 shrink-0 transition-all duration-300",
            isMinimized && "h-full border-b-0 justify-center"
        )}>
            <div className={cn("flex items-center gap-3", isMinimized && "mr-auto")}>
                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <PiggyBank className="w-4 h-4 text-amber-500" />
                </div>
                <span className="font-bold text-sm whitespace-nowrap bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                    Budget Buddy AI
                </span>
                {!isMinimized && userPersona && PERSONA_THEME[userPersona as PersonaType] && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={cn(
                            "flex items-center gap-1 px-2 py-0.5 rounded-full border shadow-sm ml-2 transition-colors duration-300 shrink-0",
                            PERSONA_THEME[userPersona as PersonaType].bg,
                            PERSONA_THEME[userPersona as PersonaType].border,
                            PERSONA_THEME[userPersona as PersonaType].color
                        )}
                    >
                        <span className="text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                            <span className="text-sm leading-none filter drop-shadow-sm">{PERSONA_THEME[userPersona as PersonaType].icon}</span>
                            <span>{userPersona}</span>
                        </span>
                    </motion.div>
                )}
            </div>
            <div className="flex items-center gap-2">
                {!isMinimized && (
                    <div className="flex items-center gap-1.5">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onToggleAutoSpeak}
                            className={cn(
                                "h-8 w-8 transition-colors",
                                isAutoSpeak ? "text-primary" : "text-muted-foreground"
                            )}
                            title={isAutoSpeak ? "Voice Mode: ON" : "Voice Mode: OFF"}
                        >
                            {isAutoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleExportPDF}
                            className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                            title="Export PDF Report"
                            disabled={history.length === 0}
                        >
                            <Download className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClearHistory}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                            title="Clear history"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                )}
                {!isMinimized && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={onToggleExpand}
                        title={isExpanded ? "Shrink" : "Expand"}
                    >
                        {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </Button>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={onToggleMinimize}
                    title={isMinimized ? "Show" : "Hide"}
                >
                    {isMinimized ? <Maximize2 className="h-4 w-4 rotate-45" /> : <X className="h-4 w-4" />}
                </Button>
            </div>
        </div>
    );
};
