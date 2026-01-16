import prisma from "@/lib/prisma";
import { GetFormatterForCurrency } from "@/lib/helper";
import { currentUser } from "@clerk/nextjs/server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import React from "react";

export default async function RecentTransactions() {
  const user = await currentUser();
  if(!user) return null;

  const transactions = await prisma.transaction.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
    take: 5,
  });
  
  const userSettings = await prisma.userSettings.findUnique({
      where: { userId: user.id }
  });
  
  const formatter = GetFormatterForCurrency(userSettings?.currency || "USD");

  return (
    <Card className="h-full">
       <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Transactions</CardTitle>
          <Button variant="ghost" asChild size="sm">
            <Link href="/transactions">View All <ArrowRight className="ml-2 h-4 w-4"/></Link>
          </Button>
       </CardHeader>
       <CardContent className="flex flex-col gap-4">
          {transactions.length === 0 && <div className="text-muted-foreground text-center py-4">No recent transactions</div>}
          {transactions.map(t => (
             <div key={t.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                {/* Icon + Info */}
                <div className="flex items-center gap-3">
                   <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-xl" role="img" aria-label={t.category}>
                        {t.categoryIcon || "❓"}
                   </div>
                   <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium leading-none">{t.description || t.category}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">{t.date.toLocaleDateString()}</p>
                        <div className={`text-[10px] px-1.5 py-0.5 rounded-full ${t.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            {t.type}
                        </div>
                      </div>
                   </div>
                </div>
                {/* Amount */}
                <div className={`font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                   {t.type === 'income' ? '+' : '-'}{formatter.format(t.amount)}
                </div>
             </div>
          ))}
       </CardContent>
    </Card>
  )
}
