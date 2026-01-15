"use client";

import { DateRangePicker } from "@/components/ui/date-range-picker";
import { MAX_DATE_RANGE_DAYS } from "@/lib/constants";
import { differenceInDays, startOfMonth } from "date-fns";
import React, { useState } from "react";
import { toast } from "sonner";
import TransactionTable from "./_components/TransactionTable";
import AdvancedSearch, { SearchFilters } from "../_components/AdvancedSearch";
import { useQuery } from "@tanstack/react-query";

const TransactionPage = () => {
  const [dataRange, setDataRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });
  const [searchFilters, setSearchFilters] = useState<SearchFilters | undefined>(
    undefined
  );

  const categoriesQuery = useQuery({
    queryKey: ["categories", "all"],
    queryFn: () => fetch("/api/categories").then((res) => res.json()),
  });
  return (
    <>
      <div className="border-b bg-card">
        <div className="container flex flex-wrap items-center justify-between gap-6 py-8">
          <div>
            <p className="text-3xl font-bold ">Transactions history</p>
          </div>

          <div className="flex items-center gap-2">
            <AdvancedSearch
              onSearch={setSearchFilters}
              categories={categoriesQuery.data?.map((c: any) => c.name) || []}
            />
            <DateRangePicker
              initialDateFrom={dataRange.from}
              initialDateTo={dataRange.to}
              showCompare={false}
              onUpdate={(values) => {
                const { from, to } = values.range;

                if (!from || !to) return;
                if (differenceInDays(to, from) > MAX_DATE_RANGE_DAYS) {
                  toast.error(
                    `The selected date range is too big. Max allowed range is ${MAX_DATE_RANGE_DAYS} days`
                  );
                  return;
                }
                setDataRange({ from, to });
              }}
            />
          </div>
        </div>
      </div>
      <div className="container">
        <TransactionTable
          from={dataRange.from}
          to={dataRange.to}
          searchFilters={searchFilters}
        />
      </div>
    </>
  );
};

export default TransactionPage;
