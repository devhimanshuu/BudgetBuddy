import jsPDF from "jspdf";
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
  categoryName: string
): string {
  // Clean the category name
  const cleanName = categoryName || "";

  // Check if icon contains emoji (Unicode characters beyond basic Latin)
  const hasEmoji =
    categoryIcon &&
    /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(
      categoryIcon
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
  options: ExportOptions
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Add title
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  const cleanTitle = cleanTextForPDF(options.title) || "Transaction History";
  doc.text(cleanTitle, pageWidth / 2, 20, { align: "center" });

  // Add date range if provided
  if (options.dateRange) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const dateText = `Period: ${new Date(
      options.dateRange.from
    ).toLocaleDateString()} - ${new Date(
      options.dateRange.to
    ).toLocaleDateString()}`;
    doc.text(dateText, pageWidth / 2, 28, { align: "center" });
  }

  // Add generation date
  doc.setFontSize(8);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, 35, {
    align: "center",
  });

  // Calculate totals
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  // Add summary section with styled box
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Summary", 14, 45);

  // Draw summary box
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(14, 48, pageWidth - 28, 22, 2, 2, "FD");

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.text(`Total Income:`, 18, 54);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(16, 185, 129); // Green
  doc.text(formatCurrency(totalIncome, options.currency), 60, 54);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.text(`Total Expense:`, 18, 60);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(239, 68, 68); // Red
  doc.text(formatCurrency(totalExpense, options.currency), 60, 60);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.text(`Net Balance:`, 18, 66);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(
    balance >= 0 ? 16 : 239,
    balance >= 0 ? 185 : 68,
    balance >= 0 ? 129 : 68
  );
  doc.text(formatCurrency(balance, options.currency), 60, 66);

  // Reset text color
  doc.setTextColor(0, 0, 0);

  // Prepare table data with cleaned text
  const tableData = transactions.map((t) => [
    new Date(t.date).toLocaleDateString(),
    cleanTextForPDF(t.description) || "No description",
    getCategoryDisplay(t.categoryIcon, t.category),
    t.type === "income" ? formatCurrency(t.amount, options.currency) : "-",
    t.type === "expense" ? formatCurrency(t.amount, options.currency) : "-",
  ]);

  // Add transactions table
  autoTable(doc, {
    startY: 75,
    head: [["Date", "Description", "Category", "Income", "Expense"]],
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
      0: { cellWidth: 25 },
      1: { cellWidth: 55 },
      2: { cellWidth: 35 },
      3: { cellWidth: 32, halign: "right" },
      4: { cellWidth: 32, halign: "right" },
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
  categoryData: any[],
  trendsData: any[],
  options: ExportOptions
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
      options.dateRange.from
    ).toLocaleDateString()} - ${new Date(
      options.dateRange.to
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

  if (categoryData && categoryData.length > 0) {
    const totalAmount = categoryData.reduce(
      (sum: number, i: any) => sum + i.amount,
      0
    );

    const categoryTableData = categoryData.map((item) => [
      getCategoryDisplay(item.categoryIcon, item.category),
      formatCurrency(item.amount, options.currency),
      `${((item.amount / totalAmount) * 100).toFixed(1)}%`,
    ]);

    autoTable(doc, {
      startY: 50,
      head: [["Category", "Amount", "Percentage"]],
      body: categoryTableData,
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
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { halign: "right", cellWidth: 50 },
        2: { halign: "right", cellWidth: 40 },
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

  // Trends Section
  const finalY = (doc as any).lastAutoTable?.finalY || 50;

  // Check if we need a new page
  let startY: number;
  if (finalY > pageHeight - 80) {
    doc.addPage();
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Income vs Expense Trends", 14, 20);
    startY = 25;
  } else {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Income vs Expense Trends", 14, finalY + 15);
    startY = finalY + 20;
  }

  if (trendsData && trendsData.length > 0) {
    const trendsTableData = trendsData
      .slice(0, 30)
      .map((item) => [
        new Date(item.date).toLocaleDateString(),
        formatCurrency(item.income, options.currency),
        formatCurrency(item.expense, options.currency),
        formatCurrency(item.balance, options.currency),
      ]);

    autoTable(doc, {
      startY: startY,
      head: [["Date", "Income", "Expense", "Balance"]],
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
        0: { cellWidth: 35 },
        1: { halign: "right", cellWidth: 45 },
        2: { halign: "right", cellWidth: 45 },
        3: { halign: "right", cellWidth: 45 },
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
