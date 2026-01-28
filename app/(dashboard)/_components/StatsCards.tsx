"use client";

import { GetBalanceStatsResponseType } from "@/app/api/stats/balance/route";
import SkeletonWrapper from "@/components/SkeletonWrapper";
import { Card } from "@/components/ui/card";
import { DateToUTCDate, GetFormatterForCurrency } from "@/lib/helper";
import { UserSettings } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { TrendingDown, TrendingUp, Wallet } from "lucide-react";
import React, { ReactNode, useCallback, useMemo } from "react";
import CountUp from "react-countup";

interface Props {
  from: Date;
  to: Date;
  userSettings: UserSettings;
}
const StatsCards = ({ from, to, userSettings }: Props) => {
  const stateQuery = useQuery<GetBalanceStatsResponseType>({
    queryKey: ["overview", "stats", from.toISOString(), to.toISOString()],
    queryFn: () =>
      fetch(
        `/api/stats/balance?from=${DateToUTCDate(from)}&to=${DateToUTCDate(to)}`
      ).then((res) => res.json()),
  });

  const formatter = useMemo(() => {
    return GetFormatterForCurrency(userSettings.currency);
  }, [userSettings.currency]);

  const income = stateQuery.data?.income || 0;
  const expense = stateQuery.data?.expense || 0;

  const balance = income - expense;

  return (
    <div className="relative flex w-full flex-wrap gap-2 md:flex-nowrap 3xl:gap-4">
      <SkeletonWrapper isLoading={stateQuery.isFetching}>
        <StatCard
          formatter={formatter}
          value={income}
          title="Income"
          icon={
            <TrendingUp className="h-12 w-12 items-center rounded-lg p-2 text-emerald-500 bg-emerald-400/10 3xl:h-14 3xl:w-14" />
          }
        />
      </SkeletonWrapper>
      <SkeletonWrapper isLoading={stateQuery.isFetching}>
        <StatCard
          formatter={formatter}
          value={expense}
          title="Expense"
          icon={
            <TrendingDown className="h-12 w-12 items-center rounded-lg p-2 text-red-500 bg-red-400/10 3xl:h-14 3xl:w-14" />
          }
        />
      </SkeletonWrapper>
      <SkeletonWrapper isLoading={stateQuery.isFetching}>
        <StatCard
          formatter={formatter}
          value={balance}
          title="Balance"
          icon={
            <Wallet className="h-12 w-12 items-center rounded-lg p-2 text-violet-500 bg-violet-400/10 3xl:h-14 3xl:w-14" />
          }
        />
      </SkeletonWrapper>
    </div>
  );
};

export default StatsCards;

function StatCard({
  formatter,
  value,
  title,
  icon,
}: {
  formatter: Intl.NumberFormat;
  icon: ReactNode;
  title: String;
  value: number;
}) {
  const formatfn = useCallback(
    (value: number) => {
      return formatter.format(value);
    },
    [formatter]
  );

  return (
    <Card className="group flex h-24 w-full items-center gap-2 p-4 relative overflow-hidden 3xl:h-28 3xl:gap-3 3xl:p-6">
      {/* Animated background gradient */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative z-10 transition-transform duration-300 group-hover:scale-110">
        {icon}
      </div>
      <div className="relative z-10 flex flex-col items-start gap-0">
        <p className="text-muted-foreground 3xl:text-base">{title}</p>
        <CountUp
          preserveValue
          redraw={false}
          end={value}
          decimals={2}
          formattingFn={formatfn}
          className="text-2xl font-bold 3xl:text-3xl"
          duration={2}
        />
      </div>
    </Card>
  );
}
