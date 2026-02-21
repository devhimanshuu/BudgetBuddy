"use client";

// Helper: extract balanced-brace JSON from a tag like [TAG: { ... }]
export const extractBalancedJson = (
	text: string,
	tag: string,
): { json: string; fullMatch: string; index: number }[] => {
	const results: { json: string; fullMatch: string; index: number }[] = [];
	const prefix = `[${tag}:`;
	let searchStart = 0;
	while (true) {
		const tagStart = text.indexOf(prefix, searchStart);
		if (tagStart === -1) break;
		// Find the opening brace
		const braceStart = text.indexOf("{", tagStart + prefix.length);
		if (braceStart === -1) break;
		// Count braces to find the matching closing brace
		let depth = 0;
		let i = braceStart;
		for (; i < text.length; i++) {
			if (text[i] === "{") depth++;
			else if (text[i] === "}") {
				depth--;
				if (depth === 0) break;
			}
		}
		if (depth !== 0) {
			searchStart = tagStart + 1;
			continue;
		}
		// Now find the closing bracket ']'
		const closingBracket = text.indexOf("]", i + 1);
		if (closingBracket === -1) {
			searchStart = tagStart + 1;
			continue;
		}
		const jsonStr = text.substring(braceStart, i + 1);
		const fullMatch = text.substring(tagStart, closingBracket + 1);
		results.push({ json: jsonStr, fullMatch, index: tagStart });
		searchStart = closingBracket + 1;
	}
	return results;
};

// Helper: strip all Living UI component tags from text for clean markdown
export const stripComponentTags = (text: string): string => {
	let cleaned = text;
	const tags = [
		"PROGRESS_BAR",
		"MINI_TREND",
		"BAR_CHART",
		"PIE_CHART",
		"COMPARISON",
		"HEATMAP",
		"LINE_CHART",
		"SUGGESTIONS",
		"BUDGET_ADJUSTER",
		"TRANSACTION_CARD",
		"ALERT",
		"GOAL_PROGRESS",
		"FORECAST",
		"STREAK",
		"ACHIEVEMENT",
	];
	for (const tag of tags) {
		const prefix = `[${tag}:`;
		let searchStart = 0;
		while (true) {
			const tagStart = cleaned.indexOf(prefix, searchStart);
			if (tagStart === -1) break;
			// For SUGGESTIONS, look for [...] pattern
			if (tag === "SUGGESTIONS") {
				// Find the outer closing bracket, accounting for inner brackets
				let depth = 0;
				let i = tagStart;
				for (; i < cleaned.length; i++) {
					if (cleaned[i] === "[") depth++;
					else if (cleaned[i] === "]") {
						depth--;
						if (depth === 0) break;
					}
				}
				if (depth === 0) {
					cleaned = cleaned.substring(0, tagStart) + cleaned.substring(i + 1);
				} else {
					// Incomplete tag (still typing) — remove from tagStart to end
					cleaned = cleaned.substring(0, tagStart);
					break;
				}
			} else {
				// For JSON-based tags, find balanced braces then closing bracket
				const braceStart = cleaned.indexOf("{", tagStart + prefix.length);
				if (braceStart === -1) {
					// Tag started typing but no brace yet — remove from tagStart to end
					cleaned = cleaned.substring(0, tagStart);
					break;
				}
				let depth = 0;
				let i = braceStart;
				for (; i < cleaned.length; i++) {
					if (cleaned[i] === "{") depth++;
					else if (cleaned[i] === "}") {
						depth--;
						if (depth === 0) break;
					}
				}
				if (depth !== 0) {
					// Incomplete JSON (still typing) — remove from tagStart to end
					cleaned = cleaned.substring(0, tagStart);
					break;
				}
				const closingBracket = cleaned.indexOf("]", i + 1);
				if (closingBracket === -1) {
					// No closing bracket yet — remove from tagStart to end
					cleaned = cleaned.substring(0, tagStart);
					break;
				}
				cleaned =
					cleaned.substring(0, tagStart) +
					cleaned.substring(closingBracket + 1);
			}
		}
	}
	// Strip internal IDs like ID[uuid] or (ID: uuid)
	cleaned = cleaned.replace(/ID\[[a-f0-9-]+\]/gi, "");
	cleaned = cleaned.replace(/\(ID:\s*[a-f0-9-]+\)/gi, "");
	cleaned = cleaned.replace(/ID:\s*[a-f0-9-]+/gi, "");

	return cleaned.trim();
};

export const detectVoiceCommand = (
	text: string,
): { type: string; feedback: string } | null => {
	const lower = text.toLowerCase().trim();

	// Add Expense: "add 50 dollars for coffee", "spent 20 on lunch"
	const expenseMatch = lower.match(
		/(?:add|spent|log|create)\s*(?:an?\s*)?(?:expense\s*)?(?:of\s*)?\$?(\d+(?:\.\d{2})?)\s*(?:dollars?)?\s*(?:for|on|at)?\s*(.+)/i,
	);
	if (expenseMatch) {
		return {
			type: "ADD_EXPENSE",
			feedback: `Processing expense: $${expenseMatch[1]} for ${expenseMatch[2]}...`,
		};
	}

	// Show Budget: "show my food budget", "how much is left in bills budget"
	if (
		lower.includes("budget") &&
		(lower.includes("show") ||
			lower.includes("check") ||
			lower.includes("how much"))
	) {
		return {
			type: "SHOW_BUDGET",
			feedback: "Checking your budget status...",
		};
	}

	// Search/Yesterday: "what did i spend yesterday", "show transactions from last week"
	if (
		lower.includes("spend") ||
		lower.includes("transaction") ||
		lower.includes("history")
	) {
		if (
			lower.includes("yesterday") ||
			lower.includes("last week") ||
			lower.includes("month")
		) {
			return {
				type: "SEARCH",
				feedback: "Fetching your spending history...",
			};
		}
	}

	return null;
};
