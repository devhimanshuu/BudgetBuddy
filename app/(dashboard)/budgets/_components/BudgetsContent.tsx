"use client";

import { PermissionGuard } from "@/components/PermissionGuard";

import { Button } from "@/components/ui/button";
import { UserSettings } from "@prisma/client";
import { Copy, PlusCircle } from "lucide-react";
import { useState } from "react";
import CreateBudgetDialog from "./CreateBudgetDialog";
import BudgetTemplatesDialog from "./BudgetTemplatesDialog";
import BudgetProgressCards from "./BudgetProgressCards";
import SweepBanner from "./SweepBanner";
import AutoSuggestBudgetButton from "./AutoSuggestBudgetButton";
import BudgetGridView from "./BudgetGridView";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Lock, Unlock, DownloadIcon, FileText, ChevronDown, LayoutGrid, CreditCard } from "lucide-react";
import { mkConfig, generateCsv, download } from "export-to-csv";
import { exportBudgetToPDF } from "@/lib/pdf-export";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BudgetsContentProps {
  userSettings: UserSettings;
}

export default function BudgetsContent({ userSettings }: BudgetsContentProps) {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [isFrozen, setIsFrozen] = useState(false);
  const [viewMode, setViewMode] = useState<"card" | "grid">("card");

  const queryClient = useQueryClient();

  const csvConfig = mkConfig({
    fieldSeparator: ",",
    decimalSeparator: ".",
    useKeysAsHeaders: true,
  });

  const handleExportCSV = () => {
    const data = queryClient.getQueryData(["budget-progress", selectedMonth, selectedYear]) as any;
    if (!data || data.length === 0) {
      toast.error("No budget data available to export");
      return;
    }
    const csvData = data.map((b: any) => ({
      Category: b.category,
      "Budget Amount": b.budgetAmount,
      Spent: b.spent,
      Remaining: b.remaining,
      Percentage: `${b.percentage}%`,
      "Over Budget": b.isOverBudget ? "Yes" : "No",
    }));
    const csv = generateCsv(csvConfig)(csvData);
    download(csvConfig)(csv);
  };

  const handleExportPDF = () => {
    const data = queryClient.getQueryData(["budget-progress", selectedMonth, selectedYear]) as any;
    if (!data || data.length === 0) {
      toast.error("No budget data available to export");
      return;
    }
    exportBudgetToPDF(data, {
      title: `Budget_Report_${months[selectedMonth]}_${selectedYear}`,
      currency: userSettings.currency,
    });
  };



  const copyPreviousMonthMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/budgets/copy-previous", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetMonth: selectedMonth,
          targetYear: selectedYear,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to copy budgets");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["budget-progress"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i);

  return (
    <>
      <div className="border-b bg-card">
        <div className="container flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Budget Goals</h1>
            <p className="text-muted-foreground">
              Set spending limits and track your progress
            </p>
          </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
                <Select
                  value={selectedMonth.toString()}
                  onValueChange={(value) => setSelectedMonth(parseInt(value))}
                >
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month, index) => {
                      const isFutureMonth = selectedYear === currentDate.getFullYear() && index > currentDate.getMonth();
                      return (
                        <SelectItem key={index} value={index.toString()} disabled={isFutureMonth}>
                          {month}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                <Select
                  value={selectedYear.toString()}
                  onValueChange={(value) => setSelectedYear(parseInt(value))}
                >
                  <SelectTrigger className="w-full sm:w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()} disabled={year > currentDate.getFullYear()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex bg-muted p-1 rounded-md">
                <Button
                  variant={viewMode === "card" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("card")}
                  className="h-9 px-4"
                >
                  <CreditCard className="mr-2 h-4 w-4" /> Card
                </Button>
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="h-9 px-4"
                >
                  <LayoutGrid className="mr-2 h-4 w-4" /> Grid
                </Button>
              </div>

              <PermissionGuard>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={() => copyPreviousMonthMutation.mutate()}
                    disabled={copyPreviousMonthMutation.isPending}
                    className="flex-1 sm:flex-none"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    <span className="hidden lg:inline">
                      {copyPreviousMonthMutation.isPending ? "Copying..." : "Copy Previous"}
                    </span>
                    <span className="lg:hidden">
                      {copyPreviousMonthMutation.isPending ? "Copying..." : "Copy"}
                    </span>
                  </Button>

                  <AutoSuggestBudgetButton
                    month={selectedMonth}
                    year={selectedYear}
                  />

                  <BudgetTemplatesDialog
                    month={selectedMonth}
                    year={selectedYear}
                  />

                  <CreateBudgetDialog
                    trigger={
                      <Button className="flex-1 sm:flex-none">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        <span className="hidden lg:inline">Create Budget</span>
                        <span className="lg:hidden">Create</span>
                      </Button>
                    }
                    month={selectedMonth}
                    year={selectedYear}
                  />

                  <Button
                    variant="outline"
                    onClick={() => setIsFrozen(!isFrozen)}
                    className="flex-1 sm:flex-none"
                  >
                    {isFrozen ? <Lock className="mr-2 h-4 w-4 text-emerald-500" /> : <Unlock className="mr-2 h-4 w-4" />}
                    <span className="hidden lg:inline">{isFrozen ? "Unfreeze" : "Freeze"}</span>
                    <span className="lg:hidden">{isFrozen ? "Unfreeze" : "Freeze"}</span>
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="flex-1 sm:flex-none">
                        <DownloadIcon className="mr-2 h-4 w-4" />
                        <span className="hidden lg:inline">Export</span>
                        <span className="lg:hidden">Export</span>
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleExportCSV} className="cursor-pointer">
                        <DownloadIcon className="mr-2 h-4 w-4" /> Export CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleExportPDF} className="cursor-pointer">
                        <FileText className="mr-2 h-4 w-4" /> Export PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </PermissionGuard>
            </div>
        </div>
      </div >

      <div className="container py-4 md:py-6">
        <SweepBanner
          userSettings={userSettings}
          month={selectedMonth}
          year={selectedYear}
        />
        {viewMode === "card" ? (
          <BudgetProgressCards
            userSettings={userSettings}
            month={selectedMonth}
            year={selectedYear}
            isFrozen={isFrozen}
          />
        ) : (
          <BudgetGridView userSettings={userSettings} year={selectedYear} />
        )}
      </div>
    </>
  );
}
