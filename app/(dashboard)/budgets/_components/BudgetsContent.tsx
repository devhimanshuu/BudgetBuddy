"use client";

import { Button } from "@/components/ui/button";
import { UserSettings } from "@prisma/client";
import { Copy, PlusCircle } from "lucide-react";
import { useState } from "react";
import CreateBudgetDialog from "./CreateBudgetDialog";
import BudgetProgressCards from "./BudgetProgressCards";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BudgetsContentProps {
  userSettings: UserSettings;
}

export default function BudgetsContent({ userSettings }: BudgetsContentProps) {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const queryClient = useQueryClient();

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
        <div className="container flex flex-wrap items-center justify-between gap-6 py-4">
          <div>
            <p className="text-3xl font-bold">Budget Goals</p>
            <p className="text-muted-foreground">
              Set spending limits and track your progress
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Select
              value={selectedMonth.toString()}
              onValueChange={(value) => setSelectedMonth(parseInt(value))}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((month, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedYear.toString()}
              onValueChange={(value) => setSelectedYear(parseInt(value))}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => copyPreviousMonthMutation.mutate()}
              disabled={copyPreviousMonthMutation.isPending}
            >
              <Copy className="mr-2 h-4 w-4" />
              {copyPreviousMonthMutation.isPending ? "Copying..." : "Copy Previous"}
            </Button>

            <CreateBudgetDialog
              trigger={
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Budget
                </Button>
              }
              month={selectedMonth}
              year={selectedYear}
            />
          </div>
        </div>
      </div>

      <div className="container py-6">
        <BudgetProgressCards
          userSettings={userSettings}
          month={selectedMonth}
          year={selectedYear}
        />
      </div>
    </>
  );
}
