"use client";

import React, {
	createContext,
	useContext,
	useEffect,
	useState,
	ReactNode,
} from "react";

interface PrivacyContextType {
	isPrivacyMode: boolean;
	togglePrivacyMode: () => void;
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

export const PrivacyProvider = ({ children }: { children: ReactNode }) => {
	const [isPrivacyMode, setIsPrivacyMode] = useState<boolean>(false);
	const [isMounted, setIsMounted] = useState(false);

	// Load preference from localStorage on mount
	useEffect(() => {
		setIsMounted(true);
		const stored = localStorage.getItem("privacy-mode");
		if (stored === "true") {
			setIsPrivacyMode(true);
		}
	}, []);

	const togglePrivacyMode = () => {
		setIsPrivacyMode((prev) => {
			const newValue = !prev;
			localStorage.setItem("privacy-mode", String(newValue));
			return newValue;
		});
	};

	return (
		<PrivacyContext.Provider value={{ isPrivacyMode, togglePrivacyMode }}>
			{children}
		</PrivacyContext.Provider>
	);
};

export const usePrivacyMode = () => {
	const context = useContext(PrivacyContext);
	if (context === undefined) {
		throw new Error("usePrivacyMode must be used within a PrivacyProvider");
	}
	return context;
};
