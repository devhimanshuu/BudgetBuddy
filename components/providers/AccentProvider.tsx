"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type AccentColor = "default" | "yellow" | "green" | "blue" | "violet" | "orange" | "rose" | "emerald";

interface AccentContextType {
    accent: AccentColor;
    setAccent: (accent: AccentColor) => void;
}

const AccentContext = createContext<AccentContextType | undefined>(undefined);

export function AccentProvider({ children }: { children: React.ReactNode }) {
    const [accent, setAccent] = useState<AccentColor>("default");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const savedAccent = (localStorage.getItem("budget-buddy-accent") as AccentColor) || "default";
        setAccent(savedAccent);
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        const root = document.documentElement;
        const accents: AccentColor[] = ["default", "yellow", "green", "blue", "violet", "orange", "rose", "emerald"];

        // Remove all accent classes
        accents.forEach(a => {
            if (a !== 'default') root.classList.remove(`accent-${a}`);
        });

        // Add new accent class
        if (accent !== "default") {
            root.classList.add(`accent-${accent}`);
        }

        localStorage.setItem("budget-buddy-accent", accent);
    }, [accent, mounted]);

    return (
        <AccentContext.Provider value={{ accent, setAccent }}>
            {children}
        </AccentContext.Provider>
    );
}

export function useAccent() {
    const context = useContext(AccentContext);
    if (context === undefined) {
        throw new Error("useAccent must be used within an AccentProvider");
    }
    return context;
}
