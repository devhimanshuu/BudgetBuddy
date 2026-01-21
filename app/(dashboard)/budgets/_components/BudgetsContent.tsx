"use client";

import { Button } from "@/components/ui/button";
import { UserSettings } from "@prisma/client";
import { PlusCircle } from "lucide-react";
import { useState } from "react";
import CreateBudgetDialog from "./CreateBudgetDialog";
import BudgetProgressCards from "./BudgetProgressCards";
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
