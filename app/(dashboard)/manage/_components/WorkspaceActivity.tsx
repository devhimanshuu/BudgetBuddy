"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import SkeletonWrapper from "@/components/SkeletonWrapper";
import { GetFormatterForCurrency } from "@/lib/helper";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  History,
  Search,
  Filter,
  User,
  Clock,
  ExternalLink,
  CalendarDays,
  HandCoins,
  Lock
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PermissionGuard } from "@/components/PermissionGuard";
import { cn } from "@/lib/utils";

const ACTIVITY_TYPES = [
  { value: "ALL", label: "All Activities" },
  { value: "TRANSACTION_CREATED", label: "Transaction Created" },
  { value: "TRANSACTION_UPDATED", label: "Transaction Updated" },
  { value: "TRANSACTION_DELETED", label: "Transaction Deleted" },
  { value: "MEMBER_INVITED", label: "Member Invited" },
  { value: "MEMBER_JOINED", label: "Member Joined" },
  { value: "PERMISSIONS_UPDATED", label: "Permissions Changed" },
  { value: "OWNERSHIP_TRANSFERRED", label: "Ownership Transferred" },
  { value: "BUDGET_PROPOSED", label: "Budget Proposal" },
  { value: "BUDGET_FINALIZED", label: "Budget Finalized" },
  { value: "SETTLEMENT_PAID", label: "Debt Settled" },
];

const MONTHS = [
  { value: "ALL", label: "All Months" },
  { value: "0", label: "January" },
  { value: "1", label: "February" },
  { value: "2", label: "March" },
  { value: "3", label: "April" },
  { value: "4", label: "May" },
  { value: "5", label: "June" },
  { value: "6", label: "July" },
  { value: "7", label: "August" },
  { value: "8", label: "September" },
  { value: "9", label: "October" },
  { value: "10", label: "November" },
  { value: "11", label: "December" },
];

const currentYear = new Date().getFullYear();
const YEARS = [
  { value: "ALL", label: "All Years" },
  ...Array.from({ length: 5 }, (_, i) => ({
    value: (currentYear - i).toString(),
    label: (currentYear - i).toString(),
  })),
];

export function WorkspaceActivity({ workspaceId }: { workspaceId: string }) {
  const [type, setType] = useState("ALL");
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState("ALL");
  const [year, setYear] = useState("ALL");

  const logsQuery = useQuery({
    queryKey: ["audit-logs", workspaceId, type, search, month, year],
    queryFn: () =>
      fetch(`/api/activities?workspaceId=${workspaceId}&type=${type}&search=${search}&month=${month}&year=${year}`).then((res) =>
        res.json()
      ),
    enabled: !!workspaceId,
  });

  const activities = logsQuery.data?.activities || [];
  const currency = logsQuery.data?.currency || "USD";

  const formatter = useMemo(() => {
    return GetFormatterForCurrency(currency);
  }, [currency]);

  return (
    <PermissionGuard
      allowedRoles={["ADMIN"]}
      fallback={
        <Card className="border-primary/20 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-card to-primary/5 pb-8">
            <CardTitle className="flex items-center gap-2 text-primary">
              <History className="w-5 h-5" />
              Workspace Activity
            </CardTitle>
            <CardDescription>
              Activity logs are restricted to workspace administrators.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex h-60 items-center justify-center text-muted-foreground italic">
            <div className="flex flex-col items-center gap-2">
              <Lock className="w-8 h-8 opacity-20" />
              <p>You do not have permission to view the audit logs.</p>
            </div>
          </CardContent>
        </Card>
      }
    >
      <Card className="border-primary/20 shadow-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-card to-primary/5 pb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary">
                  <History className="w-5 h-5" />
                  Workspace Activity
                </div>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[10px] h-5">
                  Live Feed
                </Badge>
              </CardTitle>
              <CardDescription>
                Track and filter every change made in this workspace.
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search actions or users..."
                  className="pl-8 w-full sm:w-[200px] bg-background/50 h-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="w-[120px] bg-background/50 h-9">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => {
                    const now = new Date();
                    const curYear = now.getFullYear();
                    const curMonth = now.getMonth();
                    const selectedYear = year === "ALL" ? curYear : parseInt(year);

                    const isDisabled = selectedYear > curYear || (selectedYear === curYear && m.value !== "ALL" && parseInt(m.value) > curMonth);

                    return (
                      <SelectItem key={m.value} value={m.value} disabled={isDisabled}>
                        {m.label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="w-[100px] bg-background/50 h-9">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (
                    <SelectItem key={y.value} value={y.value}>
                      {y.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="w-[150px] bg-background/50 h-9">
                  <SelectValue placeholder="All Activities" />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <SkeletonWrapper isLoading={logsQuery.isLoading}>
            <ScrollArea className="h-[400px] w-full">
              {activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground italic">
                  <div className="p-4 bg-muted/20 rounded-full mb-4">
                    <History className="w-8 h-8 opacity-20" />
                  </div>
                  No activities found matching your filters.
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {activities.map((log: any) => (
                    <div
                      key={log.id}
                      className="p-4 hover:bg-muted/30 transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-3">
                          <div className={cn(
                            "mt-1 p-2 rounded-lg shrink-0",
                            getTypeColor(log.type)
                          )}>
                            <ActivityIcon type={log.type} />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">
                              {log.description}
                            </p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {log.userId === "system" ? "System" : (log.user?.name || `ID: ${log.userId.slice(0, 8)}...`)}
                              </span>
                              <span className="flex items-center gap-1">
                                <CalendarDays className="w-3 h-3" />
                                {format(new Date(log.createdAt), "MMM d, yyyy • HH:mm")}
                              </span>
                              <Badge variant="outline" className="text-[10px] py-0 px-1 font-mono uppercase opacity-70">
                                {log.type.replace(/_/g, " ")}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        {log.metadata?.amount && (
                          <div className="text-right shrink-0">
                            <Badge
                              variant="outline"
                              className={cn(
                                "font-mono text-[10px] font-bold",
                                log.metadata.type === "income"
                                  ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/5"
                                  : log.metadata.type === "investment"
                                    ? "border-indigo-500/30 text-indigo-500 bg-indigo-500/5"
                                    : "border-red-500/30 text-red-500 bg-red-500/5"
                              )}
                            >
                              {log.metadata.type === "income" ? "+" : "-"}{formatter.format(log.metadata.amount)}
                            </Badge>
                          </div>
                        )}
                        {!log.metadata?.amount && log.metadata && (
                          <div className="hidden sm:block">
                            <Badge variant="secondary" className="text-[10px] bg-primary/5 text-primary">
                              Details
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </SkeletonWrapper>
        </CardContent>
        <div className="p-3 bg-muted/20 border-t flex items-center justify-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
            END OF ACTIVITY LOG
          </p>
        </div>
      </Card>
    </PermissionGuard>
  );
}

function getTypeColor(type: string) {
  if (type.includes("CREATED") || type.includes("FINALIZED") || type.includes("PAID") || type.includes("JOINED")) return "bg-emerald-500/10 text-emerald-500";
  if (type.includes("DELETED") || type.includes("REJECTED")) return "bg-red-500/10 text-red-500";
  if (type.includes("UPDATED") || type.includes("TRANSFERRED")) return "bg-blue-500/10 text-blue-500";
  if (type.includes("PERMISSIONS") || type.includes("PROPOSED")) return "bg-amber-500/10 text-amber-500";
  return "bg-slate-500/10 text-slate-500";
}

function ActivityIcon({ type }: { type: string }) {
  if (type.includes("TRANSACTION")) return <ExternalLink className="w-4 h-4" />;
  if (type.includes("MEMBER") || type.includes("OWNERSHIP")) return <User className="w-4 h-4" />;
  if (type.includes("PERMISSIONS")) return <Clock className="w-4 h-4" />;
  if (type.includes("BUDGET")) return <CalendarDays className="w-4 h-4" />;
  if (type.includes("SETTLEMENT")) return <HandCoins className="w-4 h-4" />;
  return <Filter className="w-4 h-4" />;
}
