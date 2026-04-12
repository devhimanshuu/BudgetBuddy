"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserSettings } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import SkeletonWrapper from "@/components/SkeletonWrapper";
import { toast } from "sonner";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { GetFormatterForCurrency } from "@/lib/helper";

interface BudgetGridViewProps {
  userSettings: UserSettings;
  year: number;
}

interface Budget {
  id: string;
  category: string;
  categoryIcon: string;
  amount: number;
  month: number;
  year: number;
}

interface Category {
  name: string;
  icon: string;
  type: string;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function BudgetCell({
  initialAmount,
  month,
  year,
  category,
  categoryIcon,
  disabled
}: {
  initialAmount: number | "";
  month: number;
  year: number;
  category: string;
  categoryIcon: string;
  disabled: boolean;
}) {
  const [value, setValue] = useState<string>(
    initialAmount !== "" ? initialAmount.toString() : ""
  );
  const queryClient = useQueryClient();

  useEffect(() => {
    setValue(initialAmount !== "" ? initialAmount.toString() : "");
  }, [initialAmount]);

  const mutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          categoryIcon,
          amount,
          month,
          year,
        }),
      });
      if (!response.ok) throw new Error("Failed to save budget");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets", year] });
      queryClient.invalidateQueries({ queryKey: ["budget-progress"] });
      toast.success(`Saved ${category} budget for ${MONTHS[month]} ${year}`);
    },
    onError: () => {
      toast.error("Failed to save budget");
      setValue(initialAmount !== "" ? initialAmount.toString() : "");
    },
  });

  const handleBlur = () => {
    if (value === "" && initialAmount === "") return;
    if (value !== "" && parseFloat(value) === initialAmount) return;

    if (value === "") {
        // Technically should delete if empty, but for now we skip or can set to 0
        return;
    }

    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      // Optimistically update or just start mutation
      mutation.mutate(numValue);
    } else {
      toast.error("Invalid amount");
      setValue(initialAmount !== "" ? initialAmount.toString() : "");
    }
  };

  return (
    <Input
      type="number"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleBlur}
      disabled={disabled}
      className={`h-8 w-16 md:w-24 text-right text-sm ${value !== "" && "font-semibold"} ${disabled && "bg-muted/30 cursor-not-allowed opacity-50"}`}
      placeholder="-"
    />
  );
}

export default function BudgetGridView({
  userSettings,
  year,
}: BudgetGridViewProps) {
  const { data: budgets, isFetching: budgetsFetching } = useQuery<Budget[]>({
    queryKey: ["budgets", year],
    queryFn: () =>
      fetch(`/api/budgets?year=${year}`).then((res) => res.json()),
  });

  const { data: categories, isFetching: categoriesFetching } = useQuery<
    Category[]
  >({
    queryKey: ["categories"],
    queryFn: () =>
      fetch(`/api/categories`).then((res) => res.json()),
  });

  const isLoading = budgetsFetching || categoriesFetching;

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // We only want expense categories ideally, or whatever categories user has budgets for
  const userCategories = (categories || []).filter(c => c.type === "expense");
  
  // also add categories that have budgets but might be deleted/different type
  const activeCategoryNames = new Set(userCategories.map(c => c.name));
  const missingCategories = (budgets || []).filter(b => !activeCategoryNames.has(b.category));
  
  const allCategoriesMap = new Map();
  userCategories.forEach(c => allCategoriesMap.set(c.name, c));
  missingCategories.forEach(b => {
      if(!allCategoriesMap.has(b.category)) {
          allCategoriesMap.set(b.category, { name: b.category, icon: b.categoryIcon });
      }
  });

  const allCategories = Array.from(allCategoriesMap.values()).sort((a, b) => a.name.localeCompare(b.name));

  const formatter = GetFormatterForCurrency(userSettings.currency);

  return (
    <SkeletonWrapper isLoading={isLoading}>
      <div className="rounded-md border bg-card text-card-foreground shadow-sm">
        <ScrollArea className="w-full whitespace-nowrap">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[150px] sticky left-0 z-20 bg-muted/50 md:w-[200px] border-r">Category</TableHead>
                {MONTHS.map((monthStr, mIndex) => (
                  <TableHead key={mIndex} className="text-center w-24">
                    {monthStr}
                  </TableHead>
                ))}
                <TableHead className="text-right w-[100px]">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allCategories.map((cat) => {
                let yearlyTotal = 0;
                return (
                  <TableRow key={cat.name}>
                    <TableCell className="font-medium sticky left-0 z-10 bg-card border-r w-[150px] md:w-[200px]">
                      <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
                        <span>{cat.icon}</span>
                        <span className="truncate">{cat.name}</span>
                      </div>
                    </TableCell>
                    {MONTHS.map((_, month) => {
                      const budget = budgets?.find(
                        (b) => b.category === cat.name && b.month === month
                      );
                      if (budget) yearlyTotal += budget.amount;
                      return (
                        <TableCell key={month} className="p-2 text-center">
                          <BudgetCell
                            initialAmount={budget ? budget.amount : ""}
                            month={month}
                            year={year}
                            category={cat.name}
                            categoryIcon={cat.icon}
                            disabled={year > currentYear || (year === currentYear && month > currentMonth)}
                          />
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-right text-muted-foreground font-semibold">
                      {formatter.format(yearlyTotal)}
                    </TableCell>
                  </TableRow>
                );
              })}
              {allCategories.length === 0 && (
                <TableRow>
                    <TableCell colSpan={14} className="text-center py-6 text-muted-foreground">
                        No expense categories found. Create categories first to use grid view.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </SkeletonWrapper>
  );
}
