"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type IconSet = "emoji" | "lucide";

interface UIVibeState {
	compactMode: boolean;
	iconSet: IconSet;
	setCompactMode: (value: boolean) => void;
	setIconSet: (set: IconSet) => void;
}

export const useUIVibe = create<UIVibeState>()(
	persist(
		(set) => ({
			compactMode: false,
			iconSet: "emoji",
			setCompactMode: (value: boolean) => set({ compactMode: value }),
			setIconSet: (setVal: IconSet) => set({ iconSet: setVal }),
		}),
		{
			name: "uivibe-storage",
			storage: createJSONStorage(() => localStorage),
		},
	),
);
