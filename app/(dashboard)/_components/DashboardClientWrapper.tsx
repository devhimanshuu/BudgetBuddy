"use client";

import React, { useState, ReactNode } from "react";
import DashboardShortcuts from "@/app/(dashboard)/_components/DashboardShortcuts";
import { AIChatButton } from "@/components/AIChatButton";
import { AnimatePresence } from "framer-motion";

interface DashboardClientWrapperProps {
    children: ReactNode;
}

export function DashboardClientWrapper({ children }: DashboardClientWrapperProps) {
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const [isAIChatOpen, setIsAIChatOpen] = useState(false);

    return (
        <>
            <div className="w-full pt-[80px] md:pt-[60px] 3xl:pt-[100px]">{children}</div>
            <DashboardShortcuts
                onQuickAddOpenChange={setIsQuickAddOpen}
                onAIChatOpen={() => setIsAIChatOpen(true)}
            />
            <AnimatePresence>
                {!isQuickAddOpen && (
                    <AIChatButton
                        open={isAIChatOpen}
                        onOpenChange={setIsAIChatOpen}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
