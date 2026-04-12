import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface Transaction {
	id: string;
	date: Date | string;
	description: string;
	amount: number;
	type: string;
	category: string;
	categoryIcon: string;
}

interface ExportOptions {
	title: string;
	dateRange?: {
		from: Date;
		to: Date;
	};
	currency: string;
	isAdvanced?: boolean;
	tier?: string;
}

// Helper function to clean text for PDF (handle special characters properly)
function cleanTextForPDF(text: string): string {
	if (!text) return "";
	// Replace common problematic characters with safe alternatives
	return text
		.replace(/[^\x00-\x7F]/g, (char) => {
			// Keep basic Latin characters, replace others
			const code = char.charCodeAt(0);
			if (code > 127) {
				// Return empty string for emojis and special Unicode
				return "";
			}
			return char;
		})
		.trim();
}

// Helper function to get category display text without emojis
function getCategoryDisplay(
	categoryIcon: string,
	categoryName: string,
): string {
	// Clean the category name
	const cleanName = categoryName || "";

	// Check if icon contains emoji (Unicode characters beyond basic Latin)
	const hasEmoji =
		categoryIcon &&
		/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(
			categoryIcon,
		);

	if (hasEmoji) {
		// Return category name in brackets to indicate it's a category
		return `[${cleanName}]`;
	}

	// If no emoji, just return the category name
	return cleanName;
}

export function exportTransactionsToPDF(
	transactions: Transaction[],
	options: ExportOptions,
) {
	const doc = new jsPDF();
	const pageWidth = doc.internal.pageSize.getWidth();
	const pageHeight = doc.internal.pageSize.getHeight();

	const cleanTitle = cleanTextForPDF(options.title) || "Transaction History";

	if (options.isAdvanced) {
		// Premium Header Section
		doc.setFillColor(15, 23, 42); // slate-900
		doc.rect(0, 0, pageWidth, 45, "F");

		// Tier Accent
		const tierColor =
			options.tier === "Gold"
				? [234, 179, 8]
				: options.tier === "Platinum"
					? [34, 211, 238]
					: options.tier === "Mythic"
						? [168, 85, 247]
						: [100, 116, 139];

		doc.setFillColor(tierColor[0], tierColor[1], tierColor[2]);
		doc.rect(0, 42, pageWidth, 3, "F");

		// Tier Badge
		doc.setFillColor(tierColor[0], tierColor[1], tierColor[2]);
		doc.roundedRect(pageWidth - 45, 12, 35, 8, 2, 2, "F");
		doc.setFontSize(8);
		doc.setFont("helvetica", "bold");
		doc.setTextColor(255, 255, 255);
		doc.text(
			`${options.tier?.toUpperCase() || "STANDARD"} REPORT`,
			pageWidth - 27.5,
			17.5,
			{ align: "center" },
		);

		// Main Title
		doc.setFontSize(28);
		doc.setFont("helvetica", "bold");
		doc.setTextColor(255, 255, 255);
		doc.text(cleanTitle.toUpperCase(), 14, 28);

		doc.setFontSize(10);
		doc.setFont("helvetica", "normal");
		doc.setTextColor(148, 163, 184); // slate-400
		if (options.dateRange) {
			doc.text(
				`FINANCIAL DATA: ${new Date(
					options.dateRange.from,
				).toLocaleDateString()} - ${new Date(
					options.dateRange.to,
				).toLocaleDateString()}`,
				14,
				37,
			);
		}
	} else {
		// Standard Title
		doc.setFontSize(20);
		doc.setFont("helvetica", "bold");
		doc.text(cleanTitle, pageWidth / 2, 20, { align: "center" });

		if (options.dateRange) {
			doc.setFontSize(10);
			doc.setFont("helvetica", "normal");
			const dateText = `Period: ${new Date(
				options.dateRange.from,
			).toLocaleDateString()} - ${new Date(
				options.dateRange.to,
			).toLocaleDateString()}`;
			doc.text(dateText, pageWidth / 2, 28, { align: "center" });
		}
	}

	// Add generation date
	doc.setFontSize(8);
	doc.setTextColor(100, 116, 139);
	doc.text(
		`Generated: ${new Date().toLocaleString()}`,
		14,
		options.isAdvanced ? 53 : 35,
	);

	// Calculate totals
	const totalIncome = transactions
		.filter((t) => t.type === "income")
		.reduce((sum, t) => sum + t.amount, 0);
	const totalExpense = transactions
		.filter((t) => t.type === "expense")
		.reduce((sum, t) => sum + t.amount, 0);
	const totalInvestment = transactions
		.filter((t) => t.type === "investment")
		.reduce((sum, t) => sum + t.amount, 0);
	const balance = totalIncome - totalExpense - totalInvestment;

	// Add summary section
	const startY = options.isAdvanced ? 60 : 45;
	doc.setFontSize(14);
	doc.setFont("helvetica", "bold");
	doc.setTextColor(15, 23, 42);
	doc.text("FINANCIAL SUMMARY", 14, startY);

	// Draw summary box
	doc.setDrawColor(226, 232, 240);
	doc.setFillColor(248, 250, 252);
	doc.roundedRect(14, startY + 4, pageWidth - 28, 25, 3, 3, "FD");

	const colWidth = (pageWidth - 28) / 4;

	// Income
	doc.setFontSize(9);
	doc.setFont("helvetica", "bold");
	doc.setTextColor(100, 116, 139);
	doc.text("TOTAL REVENUE", 20, startY + 12);
	doc.setFontSize(14);
	doc.setTextColor(16, 185, 129);
	doc.text(formatCurrency(totalIncome, options.currency), 20, startY + 22);

	// Expense
	doc.setFontSize(9);
	doc.setFont("helvetica", "bold");
	doc.setTextColor(100, 116, 139);
	doc.text("TOTAL SPENDING", 20 + colWidth, startY + 12);
	doc.setFontSize(14);
	doc.setTextColor(239, 68, 68);
	doc.text(
		formatCurrency(totalExpense, options.currency),
		20 + colWidth,
		startY + 22,
	);

	// Investment
	doc.setFontSize(9);
	doc.setFont("helvetica", "bold");
	doc.setTextColor(100, 116, 139);
	doc.text("TOTAL INVESTED", 20 + colWidth * 2, startY + 12);
	doc.setFontSize(14);
	doc.setTextColor(79, 70, 229); // Indigo
	doc.text(
		formatCurrency(totalInvestment, options.currency),
		20 + colWidth * 2,
		startY + 22,
	);

	// Balance
	doc.setFontSize(9);
	doc.setFont("helvetica", "bold");
	doc.setTextColor(100, 116, 139);
	doc.text("NET POSITION", 20 + colWidth * 3, startY + 12);
	doc.setFontSize(14);
	doc.setTextColor(
		balance >= 0 ? 16 : 239,
		balance >= 0 ? 185 : 68,
		balance >= 0 ? 129 : 68,
	);
	doc.text(
		formatCurrency(balance, options.currency),
		20 + colWidth * 3,
		startY + 22,
	);

	// Reset colors
	doc.setTextColor(0, 0, 0);

	// Prepare table data with cleaned text
	const tableData = transactions.map((t) => [
		new Date(t.date).toLocaleDateString(),
		cleanTextForPDF(t.description) || "No description",
		getCategoryDisplay(t.categoryIcon, t.category),
		t.type === "income" ? formatCurrency(t.amount, options.currency) : "-",
		t.type === "expense" ? formatCurrency(t.amount, options.currency) : "-",
		t.type === "investment" ? formatCurrency(t.amount, options.currency) : "-",
	]);

	// Add transactions table
	autoTable(doc, {
		startY: startY + 35,
		head: [["Date", "Description", "Category", "Income", "Expense", "Investment"]],
		body: tableData,
		theme: "striped",
		headStyles: {
			fillColor: [59, 130, 246],
			textColor: [255, 255, 255],
			fontStyle: "bold",
			fontSize: 10,
		},
		styles: {
			fontSize: 9,
			cellPadding: 3,
			overflow: "linebreak",
			cellWidth: "wrap",
		},
		columnStyles: {
			0: { cellWidth: 22 },
			1: { cellWidth: 46 },
			2: { cellWidth: 30 },
			3: { cellWidth: 28, halign: "right" },
			4: { cellWidth: 28, halign: "right" },
			5: { cellWidth: 28, halign: "right" },
		},
		didDrawPage: (data) => {
			// Footer with page number
			doc.setFontSize(8);
			doc.setTextColor(128, 128, 128);
			doc.text(`Page ${data.pageNumber}`, pageWidth / 2, pageHeight - 10, {
				align: "center",
			});
			doc.setTextColor(0, 0, 0);
		},
	});

	// Save the PDF
	const fileName = `${cleanTitle.replace(/\s+/g, "_")}_${
		new Date().toISOString().split("T")[0]
	}.pdf`;
	doc.save(fileName);
}

export function exportAnalyticsToPDF(
	breakdown: { income: any[]; expense: any[]; investment: any[] },
	trendsData: any[],
	options: ExportOptions,
) {
	const doc = new jsPDF();
	const pageWidth = doc.internal.pageSize.getWidth();
	const pageHeight = doc.internal.pageSize.getHeight();

	// Add title
	doc.setFontSize(20);
	doc.setFont("helvetica", "bold");
	doc.text("Analytics Report", pageWidth / 2, 20, { align: "center" });

	// Add date range
	if (options.dateRange) {
		doc.setFontSize(10);
		doc.setFont("helvetica", "normal");
		const dateText = `Period: ${new Date(
			options.dateRange.from,
		).toLocaleDateString()} - ${new Date(
			options.dateRange.to,
		).toLocaleDateString()}`;
		doc.text(dateText, pageWidth / 2, 28, { align: "center" });
	}

	doc.setFontSize(8);
	doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, 35, {
		align: "center",
	});

	// Category Breakdown Section
	doc.setFontSize(14);
	doc.setFont("helvetica", "bold");
	doc.text("Category Breakdown", 14, 45);

	const allCategoryData: {
		title: string;
		data: any[];
		color: [number, number, number];
	}[] = [
		{ title: "Income", data: breakdown.income, color: [16, 185, 129] },
		{ title: "Expense", data: breakdown.expense, color: [239, 68, 68] },
		{ title: "Investment", data: breakdown.investment, color: [79, 70, 229] },
	];

	let currentY = 50;

	allCategoryData.forEach((section) => {
		if (section.data && section.data.length > 0) {
			doc.setFontSize(11);
			doc.setFont("helvetica", "bold");
			doc.setTextColor(section.color[0], section.color[1], section.color[2]);
			doc.text(section.title, 14, currentY + 5);
			doc.setTextColor(0, 0, 0);

			const totalAmount = section.data.reduce(
				(sum: number, i: any) => sum + i.amount,
				0,
			);

			const tableData = section.data.map((item) => [
				getCategoryDisplay(item.categoryIcon, item.category),
				formatCurrency(item.amount, options.currency),
				`${((item.amount / totalAmount) * 100).toFixed(1)}%`,
			]);

			autoTable(doc, {
				startY: currentY + 8,
				head: [["Category", "Amount", "Percentage"]],
				body: tableData,
				theme: "striped",
				headStyles: {
					fillColor: section.color,
					textColor: [255, 255, 255],
					fontStyle: "bold",
					fontSize: 9,
				},
				styles: {
					fontSize: 8,
					cellPadding: 2,
				},
				columnStyles: {
					0: { cellWidth: 80 },
					1: { halign: "right", cellWidth: 50 },
					2: { halign: "right", cellWidth: 40 },
				},
			});

			currentY = (doc as any).lastAutoTable.finalY + 10;

			// Check for page break
			if (currentY > pageHeight - 40) {
				doc.addPage();
				currentY = 20;
			}
		}
	});

	// Trends Section
	const finalY = currentY;

	// Check if we need a new page
	let startY: number;
	if (finalY > pageHeight - 80) {
		doc.addPage();
		doc.setFontSize(14);
		doc.setFont("helvetica", "bold");
		doc.setTextColor(0, 0, 0);
		doc.text("Financial Trends", 14, 20);
		startY = 25;
	} else {
		doc.setFontSize(14);
		doc.setFont("helvetica", "bold");
		doc.setTextColor(0, 0, 0);
		doc.text("Financial Trends", 14, finalY + 5);
		startY = finalY + 10;
	}

	if (trendsData && trendsData.length > 0) {
		const trendsTableData = trendsData
			.slice(0, 45)
			.map((item) => [
				new Date(item.date).toLocaleDateString(),
				formatCurrency(item.income, options.currency),
				formatCurrency(item.expense, options.currency),
				formatCurrency(item.investment, options.currency),
				formatCurrency(item.balance, options.currency),
			]);

		autoTable(doc, {
			startY: startY,
			head: [["Date", "Income", "Expense", "Investment", "Balance"]],
			body: trendsTableData,
			theme: "striped",
			headStyles: {
				fillColor: [59, 130, 246],
				textColor: [255, 255, 255],
				fontStyle: "bold",
				fontSize: 10,
			},
			styles: {
				fontSize: 9,
				cellPadding: 3,
			},
			columnStyles: {
				0: { cellWidth: 25 },
				1: { halign: "right", cellWidth: 35 },
				2: { halign: "right", cellWidth: 35 },
				3: { halign: "right", cellWidth: 35 },
				4: { halign: "right", cellWidth: 35 },
			},
			didDrawPage: (data) => {
				// Footer
				doc.setFontSize(8);
				doc.setTextColor(128, 128, 128);
				doc.text(`Page ${data.pageNumber}`, pageWidth / 2, pageHeight - 10, {
					align: "center",
				});
				doc.setTextColor(0, 0, 0);
			},
		});
	}

	// Save the PDF
	const fileName = `Analytics_Report_${
		new Date().toISOString().split("T")[0]
	}.pdf`;
	doc.save(fileName);
}

function formatCurrency(amount: number, currency: string): string {
	try {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: currency,
		}).format(amount);
	} catch (error) {
		// Fallback if currency is invalid
		return `${currency} ${amount.toFixed(2)}`;
	}
}

export function exportBudgetToPDF(
	budgetData: any[],
	options: ExportOptions,
) {
	const doc = new jsPDF();
	const pageWidth = doc.internal.pageSize.getWidth();
	const pageHeight = doc.internal.pageSize.getHeight();

	// Add title
	doc.setFontSize(20);
	doc.setFont("helvetica", "bold");
	doc.text(options.title || "Budget Report", pageWidth / 2, 20, { align: "center" });

	// Add date range
	if (options.dateRange) {
		doc.setFontSize(10);
		doc.setFont("helvetica", "normal");
		const dateText = `Period: ${new Date(
			options.dateRange.from,
		).toLocaleDateString()} - ${new Date(
			options.dateRange.to,
		).toLocaleDateString()}`;
		doc.text(dateText, pageWidth / 2, 28, { align: "center" });
	}

	doc.setFontSize(8);
	doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, 35, {
		align: "center",
	});

	let currentY = 45;

	const totalBudget = budgetData.reduce((sum, b) => sum + b.budgetAmount, 0);
	const totalSpent = budgetData.reduce((sum, b) => sum + b.spent, 0);

	doc.setFontSize(14);
	doc.setFont("helvetica", "bold");
	doc.text("Summary", 14, currentY);

	currentY += 10;
	doc.setFontSize(11);
	doc.setFont("helvetica", "normal");
	doc.text(`Total Budget: ${formatCurrency(totalBudget, options.currency)}`, 14, currentY);
	currentY += 7;
	doc.text(`Total Spent: ${formatCurrency(totalSpent, options.currency)}`, 14, currentY);
	currentY += 7;
	doc.text(`Remaining: ${formatCurrency(totalBudget - totalSpent, options.currency)}`, 14, currentY);

	currentY += 15;

	// Table Data
	const tableData = budgetData.map((b) => [
		getCategoryDisplay(b.categoryIcon, b.category),
		formatCurrency(b.budgetAmount, options.currency),
		formatCurrency(b.spent, options.currency),
		formatCurrency(b.budgetAmount - b.spent, options.currency),
		`${b.percentage.toFixed(1)}%`
	]);

	autoTable(doc, {
		startY: currentY,
		head: [["Category", "Budget", "Spent", "Remaining", "Used %"]],
		body: tableData,
		theme: "striped",
		headStyles: {
			fillColor: [59, 130, 246],
			textColor: [255, 255, 255],
			fontStyle: "bold",
			fontSize: 10,
		},
		styles: {
			fontSize: 9,
			cellPadding: 3,
		},
		columnStyles: {
			0: { cellWidth: 50 },
			1: { halign: "right", cellWidth: 30 },
			2: { halign: "right", cellWidth: 30 },
			3: { halign: "right", cellWidth: 30 },
			4: { halign: "right", cellWidth: 20 },
		},
		didDrawPage: (data) => {
			doc.setFontSize(8);
			doc.setTextColor(128, 128, 128);
			doc.text(`Page ${data.pageNumber}`, pageWidth / 2, pageHeight - 10, {
				align: "center",
			});
			doc.setTextColor(0, 0, 0);
		},
	});

	const fileName = `${(options.title || "Budget_Report").replace(/\s+/g, "_")}_${
		new Date().toISOString().split("T")[0]
	}.pdf`;
	doc.save(fileName);
}

