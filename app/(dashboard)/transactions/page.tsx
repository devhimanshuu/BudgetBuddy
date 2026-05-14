"use client";

import { Button } from "@/components/ui/button";
import { startOfMonth } from "date-fns";
import { X, Trash2 } from "lucide-react";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import TransactionTable from "./_components/TransactionTable";
import { ManageRecurringTransactions } from "./_components/ManageRecurringTransactions";
import { DetectSubscriptionDialog } from "./_components/DetectSubscriptionDialog";
import AdvancedSearch, { SearchFilters } from "../_components/AdvancedSearch";
import { useQuery } from "@tanstack/react-query";
import { PermissionGuard } from "@/components/PermissionGuard";
import CSVImportDialog from "./_components/CSVImportDialog";

const TransactionPage = () => {
  const [dataRange, setDataRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });
  const [searchFilters, setSearchFilters] = useState<SearchFilters | undefined>(
    undefined
  );

  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.get("query");
    const category = searchParams.get("category");
    const type = searchParams.get("type");
    const minAmount = searchParams.get("minAmount");
    const maxAmount = searchParams.get("maxAmount");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (query || category || type || minAmount || maxAmount || from || to) {
      setSearchFilters({
        query: query || "",
        category: category || "",
        type: type || "",
        minAmount: minAmount || "",
        maxAmount: maxAmount || "",
        from: from || "",
        to: to || "",
        tags: [],
      });
    }
  }, [searchParams]);

  const categoriesQuery = useQuery({
    queryKey: ["categories", "all"],
    queryFn: () => fetch("/api/categories").then((res) => res.json()),
  });
  return (
    <>
      <div className="border-b bg-card">
        <div className="container flex flex-wrap items-center justify-between gap-6 py-4">
          <div className="flex items-center gap-4">
            <p className="text-heading-xl">Transactions history</p>
            <Link href="/transactions/trash">
              <Button variant="outline" size="sm" className="flex items-center gap-2 border-rose-500/20 text-rose-500 hover:bg-rose-500/10 transition-all duration-300">
                <Trash2 className="h-4 w-4" />
                Trash Bin
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <PermissionGuard>
              <div className="flex flex-wrap items-center gap-2">
                <DetectSubscriptionDialog />
                <ManageRecurringTransactions />
                <CSVImportDialog />
              </div>
            </PermissionGuard>
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
          allCategories={categoriesQuery.data}
        />
      </div>
    </>
  );
};

export default TransactionPage;
