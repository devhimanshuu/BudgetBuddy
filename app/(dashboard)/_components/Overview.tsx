"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserSettings } from "@prisma/client";
import React, { useMemo, useState } from "react";
import StatsCards from "./StatsCards";
import CategoriesStats from "./CategoriesStats";

const Overview = ({ userSettings }: { userSettings: UserSettings }) => {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const dataRange = useMemo(() => {
    return {
      from: new Date(selectedYear, selectedMonth, 1),
      to: new Date(selectedYear, selectedMonth + 1, 0),
    };
  }, [selectedMonth, selectedYear]);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 3 + i);

  return (
    <>
      <div className="container flex flex-wrap items-end justify-between gap-2 py-6 3xl:gap-4 3xl:py-8">
        <h2 className="text-3xl font-bold 3xl:text-4xl">Overview</h2>
        <div className="flex items-center gap-2">
          <Select
            value={selectedMonth.toString()}
            onValueChange={(value) => setSelectedMonth(parseInt(value))}
          >
            <SelectTrigger className="w-[140px] 3xl:w-[160px]">
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
            <SelectTrigger className="w-[100px] 3xl:w-[120px]">
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
      </div>
      <div className="container flex w-full flex-col gap-2 3xl:gap-4">
        <StatsCards
          userSettings={userSettings}
          from={dataRange.from}
          to={dataRange.to}
        />
        <CategoriesStats
          userSettings={userSettings}
          from={dataRange.from}
          to={dataRange.to}
        />
      </div>
    </>
  );
};

export default Overview;
