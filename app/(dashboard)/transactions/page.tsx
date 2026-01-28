"use client";

import { Button } from "@/components/ui/button";
import { startOfMonth } from "date-fns";
import { X } from "lucide-react";
import React, { useState } from "react";
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
        <div className="container flex flex-wrap items-center justify-between gap-6 py-4">
          <div>
            <p className="text-3xl font-bold ">Transactions history</p>
          </div>

          <div className="flex items-center gap-2">
            {searchFilters &&
              Object.values(searchFilters).some(
                (val) =>
                  val !== "" && (Array.isArray(val) ? val.length > 0 : true)
              ) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchFilters(undefined)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="mr-2 h-4 w-4" />
                  Clear Filters
                </Button>
              )}
            <AdvancedSearch
              onSearch={setSearchFilters}
              categories={Array.from(new Set(categoriesQuery.data?.map((c: any) => c.name) || []))}
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
