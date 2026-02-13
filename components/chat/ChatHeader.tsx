"use client";

import React from "react";
import { motion } from "framer-motion";
import { PiggyBank, Trash2, Minimize2, Maximize2, X, FileDown, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

interface ChatHeaderProps {
    isMinimized: boolean;
    isExpanded: boolean;
    userPersona: string | null;
    history: any[];
    onToggleMinimize: () => void;
    onToggleExpand: () => void;
    onClearHistory: () => void;
}

export const ChatHeader = ({
    isMinimized,
    isExpanded,
    userPersona,
    history,
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
            "p-3 border-b border-border flex items-center justify-between bg-primary/5 shrink-0 transition-all duration-300",
            isMinimized && "h-full border-b-0 justify-center"
        )}>
            <div className={cn("flex items-center gap-2", isMinimized && "mr-auto")}>
                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <PiggyBank className="w-4 h-4 text-amber-500" />
                </div>
                <span className="font-bold text-sm whitespace-nowrap bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                    Budget Buddy AI
                </span>
                {!isMinimized && userPersona && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={cn(
                            "hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border shadow-sm ml-2",
                            userPersona === "Squirrel" && "bg-amber-500/10 border-amber-500/20 text-amber-600",
                            userPersona === "Peacock" && "bg-purple-500/10 border-purple-500/20 text-purple-600",
                            userPersona === "Owl" && "bg-indigo-500/10 border-indigo-500/20 text-indigo-600",
                            userPersona === "Fox" && "bg-orange-500/10 border-orange-500/20 text-orange-600"
                        )}
                    >
                        <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                            {userPersona === "Squirrel" && <>🐿️ <span className="opacity-80">Squirrel</span></>}
                            {userPersona === "Peacock" && <>🦚 <span className="opacity-80">Peacock</span></>}
                            {userPersona === "Owl" && <>🦉 <span className="opacity-80">Owl</span></>}
                            {userPersona === "Fox" && <>🦊 <span className="opacity-80">Fox</span></>}
                        </span>
                    </motion.div>
                )}
            </div>
            <div className="flex items-center gap-1">
                {!isMinimized && (
                    <div className="flex items-center gap-1">
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
