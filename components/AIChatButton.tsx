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
            className="fixed bottom-32 right-6 z-50 flex flex-col items-end 2xl:bottom-36 2xl:right-8 3xl:bottom-40 3xl:right-10 4xl:bottom-52 4xl:right-14"
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
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full blur opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>

                            <Button
                                onClick={() => setIsOpen(!isOpen)}
                                size="icon"
                                className="rounded-full h-16 w-16 bg-background border-2 border-amber-500/20 hover:border-amber-500/50 text-foreground relative shadow-2xl 2xl:h-18 2xl:w-18 3xl:h-20 3xl:w-20 4xl:h-24 4xl:w-24"
                            >
                                <Bot className="h-8 w-8 text-amber-500 2xl:h-9 2xl:w-9 3xl:h-10 3xl:w-10 4xl:h-12 4xl:w-12" />
                            </Button>

                            {/* Notification Badge (optional) */}
                            <div className="absolute -top-1 -right-1 flex h-4 w-4">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 text-[10px] items-center justify-center text-white font-bold">
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
