"use client";

import React, { useState } from "react";
import { Bot } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AIChatWindow } from "./AIChatWindow";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AIChatButtonProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function AIChatButton({ open, onOpenChange }: AIChatButtonProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isOpen = open !== undefined ? open : internalOpen;
    const setIsOpen = onOpenChange || setInternalOpen;


    return (
        <motion.div
            drag
            dragMomentum={false}
            className="fixed bottom-32 right-6 z-50 flex flex-col items-end"
        >
            <AIChatWindow isOpen={isOpen} onClose={() => setIsOpen(false)} />

            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="relative"
                        >
                            {/* Glow Effect */}
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-purple-600 rounded-full blur opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>

                            <Button
                                onClick={() => setIsOpen(!isOpen)}
                                size="icon"
                                className="rounded-full h-16 w-16 bg-background border-2 border-primary/20 hover:border-primary/50 text-foreground relative shadow-2xl"
                            >
                                <Bot className="h-8 w-8 text-primary" />
                            </Button>

                            {/* Notification Badge (optional) */}
                            <div className="absolute -top-1 -right-1 flex h-4 w-4">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-primary text-[10px] items-center justify-center text-primary-foreground font-bold">
                                    AI
                                </span>
                            </div>
                        </motion.div>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="bg-background border-border text-foreground">
                        <p>Chat with Budget Buddy AI</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </motion.div>
    );

}
