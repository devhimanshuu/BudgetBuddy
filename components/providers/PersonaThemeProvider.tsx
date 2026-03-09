"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { PersonaData } from "@/lib/persona";
import { useAuth } from "@clerk/nextjs";

interface PersonaThemeContextType {
    isMorphingEnabled: boolean;
    setIsMorphingEnabled: (enabled: boolean) => void;
    personaData: PersonaData | null;
    isLoading: boolean;
}

const PersonaThemeContext = createContext<PersonaThemeContextType | undefined>(undefined);

export const PersonaThemeProvider = ({ children }: { children: ReactNode }) => {
    const [isMorphingEnabled, setIsMorphingEnabled] = useState<boolean>(false);
    const { userId } = useAuth();

    // Load preference from localStorage
    useEffect(() => {
        const stored = localStorage.getItem("enablePersonaMorphing");
        if (stored === "true") {
            setIsMorphingEnabled(true);
        }
    }, []);

    // Save preference to localStorage
    useEffect(() => {
        localStorage.setItem("enablePersonaMorphing", isMorphingEnabled.toString());
    }, [isMorphingEnabled]);

    const { data: personaData, isLoading } = useQuery<PersonaData>({
        queryKey: ["persona"],
        queryFn: async () => {
            const res = await fetch("/api/persona");
            if (!res.ok) throw new Error("Failed to fetch persona");
            return res.json();
        },
        enabled: !!userId, // Only fetch if user is logged in
    });

    useEffect(() => {
        const root = window.document.documentElement;

        // Remove existing persona classes
        root.classList.remove("persona-squirrel", "persona-peacock", "persona-owl", "persona-fox");

        if (isMorphingEnabled && personaData) {
            const personaClass = `persona-${personaData.persona.toLowerCase()}`;
            root.classList.add(personaClass);
        }
    }, [isMorphingEnabled, personaData]);

    return (
        <PersonaThemeContext.Provider value={{ isMorphingEnabled, setIsMorphingEnabled, personaData: personaData || null, isLoading }}>
            {children}
        </PersonaThemeContext.Provider>
    );
};

export const usePersonaTheme = () => {
    const context = useContext(PersonaThemeContext);
    if (context === undefined) {
        throw new Error("usePersonaTheme must be used within a PersonaThemeProvider");
    }
    return context;
};
