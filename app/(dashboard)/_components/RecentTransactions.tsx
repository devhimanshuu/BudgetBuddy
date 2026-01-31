"use client";

import { GetFormatterForCurrency } from "@/lib/helper";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import SkeletonWrapper from "@/components/SkeletonWrapper";
import { usePrivacyMode } from "@/components/providers/PrivacyProvider";
import { cn } from "@/lib/utils";

interface Transaction {
   id: string;
   description: string | null;
   amount: number;
   date: string | Date;
   type: string;
   category: string;
   categoryIcon: string | null;
}

export default function RecentTransactions({ userSettings }: { userSettings: any }) {
   const { isPrivacyMode } = usePrivacyMode();
   const transactionsQuery = useQuery<Transaction[]>({
      queryKey: ["recent-transactions"],
      queryFn: () => fetch("/api/transactions/recent").then((res) => res.json()),
   });

   const formatter = GetFormatterForCurrency(userSettings?.currency || "USD");
   const transactions = transactionsQuery.data || [];

   return (
      <Card className="h-full">
         <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Transactions</CardTitle>
            <Button variant="ghost" asChild size="sm">
               <Link href="/transactions">View All <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
         </CardHeader>
         <CardContent className="flex flex-col gap-4">
            <SkeletonWrapper isLoading={transactionsQuery.isFetching}>
               {transactions.length === 0 && <div className="text-muted-foreground text-center py-4">No recent transactions</div>}
               {transactions.map(t => (
                  <div key={t.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                     <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-xl" role="img" aria-label={t.category}>
                           {t.categoryIcon || "❓"}
                        </div>
                        <div className="flex flex-col gap-1">
                           <p className="text-sm font-medium leading-none">{t.description || t.category}</p>
                           <div className="flex items-center gap-2">
                              <p className="text-xs text-muted-foreground">{new Date(t.date).toLocaleDateString()}</p>
                              <div className={`text-[10px] px-1.5 py-0.5 rounded-full ${t.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                 {t.type}
                              </div>
                           </div>
                        </div>
                     </div>
                     <div className={cn(
                        "font-bold",
                        t.type === 'income' ? 'text-emerald-600' : 'text-red-600',
                        isPrivacyMode && "privacy-blur"
                     )}>
                        {t.type === 'income' ? '+' : '-'}{isPrivacyMode ? "$******" : formatter.format(t.amount)}
                     </div>
                  </div>
               ))}
            </SkeletonWrapper>
         </CardContent>
      </Card>
   )
}
