import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { differenceInDays, subDays } from "date-fns";
import { getActiveWorkspace } from "@/lib/workspaces";

export async function GET(request: Request) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const workspace = await getActiveWorkspace();
  const workspaceId = workspace?.id;

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const tags = searchParams.get("tags");

  const querySchema = z.object({ from: z.string(), to: z.string() });
  const queryParams = querySchema.safeParse({ from, to });
  if (!queryParams.success) return Response.json(queryParams.error, { status: 400 });

  const fromDate = new Date(queryParams.data.from);
  const toDate = new Date(queryParams.data.to);
  const tagIds = tags ? tags.split(",") : [];

  const daysInPeriod = Math.max(differenceInDays(toDate, fromDate) + 1, 1);
  const prevToDate = subDays(fromDate, 1);
  const prevFromDate = subDays(prevToDate, daysInPeriod - 1);

  // Parallel fetches
  const [transactions, allHistory] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        ...(workspaceId ? { workspaceId } : { userId: user.id }),
        date: { gte: fromDate, lte: toDate },
        ...(tagIds.length > 0 && { tags: { some: { tagId: { in: tagIds } } } }),
      },
    }),
    prisma.monthlyHistory.findMany({
      where: { ...(workspaceId ? { workspaceId } : { userId: user.id }) },
    }),
  ]);

  // --- 1. Stats (KPI Cards) ---
  const currentHistory = allHistory.filter(s => {
    const d = new Date(s.year, s.month, s.day);
    return d >= fromDate && d <= toDate;
  });
  const previousHistory = allHistory.filter(s => {
    const d = new Date(s.year, s.month, s.day);
    return d >= prevFromDate && d <= prevToDate;
  });

  const getStatsAgg = (filtered: typeof allHistory) => ({
    income: filtered.reduce((s, x) => s + x.income, 0),
    expense: filtered.reduce((s, x) => s + x.expense, 0),
    investment: filtered.reduce((s, x) => s + (x.investment || 0), 0),
    count: filtered.length
  });

  const currentStats = getStatsAgg(currentHistory);
  const previousStats = getStatsAgg(previousHistory);

  const currentSavings = currentStats.income - currentStats.expense - currentStats.investment;
  const previousSavings = previousStats.income - previousStats.expense - previousStats.investment;
  const currentSavingsRate = currentStats.income > 0 ? ((currentStats.income - currentStats.expense) / currentStats.income) * 100 : 0;
  const previousSavingsRate = previousStats.income > 0 ? ((previousStats.income - previousStats.expense) / previousStats.income) * 100 : 0;
  const currentVelocity = currentStats.expense / daysInPeriod;
  const previousVelocity = previousStats.expense / daysInPeriod;

  const stats = {
    savingsRate: { current: currentSavingsRate, previous: previousSavingsRate, change: currentSavingsRate - previousSavingsRate },
    disposableIncome: { current: currentSavings, previous: previousSavings, change: currentSavings - previousSavings },
    spendVelocity: { current: currentVelocity, previous: previousVelocity, change: previousVelocity > 0 ? ((currentVelocity - previousVelocity) / previousVelocity) * 100 : 0 },
    investment: { current: currentStats.investment, previous: previousStats.investment, change: currentStats.investment - previousStats.investment },
    raw: { current: currentStats, previous: previousStats }
  };

  // --- 2. Category Breakdowns ---
  const incomeBreakdownMap = new Map<string, { amount: number; icon: string }>();
  const expenseBreakdownMap = new Map<string, { amount: number; icon: string }>();
  const investmentBreakdownMap = new Map<string, { amount: number; icon: string }>();
  let totalIncome = 0;
  let totalExpense = 0;
  let totalInvestment = 0;

  transactions.forEach(t => {
    if (t.type === "income") {
      totalIncome += t.amount;
      const ex = incomeBreakdownMap.get(t.category) || { amount: 0, icon: t.categoryIcon || "" };
      incomeBreakdownMap.set(t.category, { ...ex, amount: ex.amount + t.amount });
    } else if (t.type === "expense") {
      totalExpense += t.amount;
      const ex = expenseBreakdownMap.get(t.category) || { amount: 0, icon: t.categoryIcon || "" };
      expenseBreakdownMap.set(t.category, { ...ex, amount: ex.amount + t.amount });
    } else if (t.type === "investment") {
      totalInvestment += t.amount;
      const ex = investmentBreakdownMap.get(t.category) || { amount: 0, icon: t.categoryIcon || "" };
      investmentBreakdownMap.set(t.category, { ...ex, amount: ex.amount + t.amount });
    }
  });

  const categoryBreakdown = {
    income: Array.from(incomeBreakdownMap.entries()).map(([cat, data]) => ({
      category: cat, categoryIcon: data.icon, amount: data.amount, percentage: totalIncome > 0 ? (data.amount / totalIncome) * 100 : 0
    })).sort((a,b) => b.amount - a.amount),
    expense: Array.from(expenseBreakdownMap.entries()).map(([cat, data]) => ({
      category: cat, categoryIcon: data.icon, amount: data.amount, percentage: totalExpense > 0 ? (data.amount / totalExpense) * 100 : 0
    })).sort((a,b) => b.amount - a.amount),
    investment: Array.from(investmentBreakdownMap.entries()).map(([cat, data]) => ({
      category: cat, categoryIcon: data.icon, amount: data.amount, percentage: totalInvestment > 0 ? (data.amount / totalInvestment) * 100 : 0
    })).sort((a,b) => b.amount - a.amount)
  };

  // --- 3. Trends ---
  // Note: /api/analytics/trends uses monthlyHistory, NOT transactions, so we use currentHistory!
  const trends = currentHistory.map(stat => ({
    date: new Date(stat.year, stat.month, stat.day).toISOString(),
    income: stat.income,
    expense: stat.expense,
    investment: stat.investment || 0,
    balance: stat.income - stat.expense - (stat.investment || 0)
  }));

  // --- 4. Heatmap ---
  const heatmapData: { [key: string]: { [key: string]: number } } = {};
  transactions.forEach((transaction) => {
    const date = new Date(transaction.date);
    const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "short" });
    const hour = date.getHours();
    
    if (!heatmapData[dayOfWeek]) heatmapData[dayOfWeek] = {};
    if (!heatmapData[dayOfWeek][hour]) heatmapData[dayOfWeek][hour] = 0;
    
    if (transaction.type === "expense") heatmapData[dayOfWeek][hour] += transaction.amount;
  });

  const daysOrder = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const heatmap = daysOrder.map((day) => {
    const dayData: any = { day };
    for (let hour = 0; hour < 24; hour++) {
        dayData[`h${hour}`] = heatmapData[day]?.[hour] || 0;
    }
    return dayData;
  });

  // --- 5. Cashflow Sankey ---
  const nodes: { name: string; type: "inflow" | "pipeline" | "outflow" | "investment" }[] = [];
  const links: { source: number; target: number; value: number }[] = [];

  const ROOT_NODE_NAME = "Total Budget";
  if (incomeBreakdownMap.size > 0 || expenseBreakdownMap.size > 0 || investmentBreakdownMap.size > 0) {
    nodes.push({ name: ROOT_NODE_NAME, type: "pipeline" });
    const rootIdx = 0;

    Array.from(incomeBreakdownMap.entries()).forEach(([cat, data]) => {
      const nodeIdx = nodes.length;
      nodes.push({ name: cat, type: "inflow" });
      links.push({ source: nodeIdx, target: rootIdx, value: data.amount });
    });

    Array.from(expenseBreakdownMap.entries()).forEach(([cat, data]) => {
      const nodeIdx = nodes.length;
      nodes.push({ name: cat, type: "outflow" });
      links.push({ source: rootIdx, target: nodeIdx, value: data.amount });
    });

    Array.from(investmentBreakdownMap.entries()).forEach(([cat, data]) => {
      const nodeIdx = nodes.length;
      nodes.push({ name: cat, type: "investment" });
      links.push({ source: rootIdx, target: nodeIdx, value: data.amount });
    });

    if (totalIncome > (totalExpense + totalInvestment)) {
      nodes.push({ name: "Savings/Surplus", type: "outflow" });
      links.push({ source: rootIdx, target: nodes.length - 1, value: totalIncome - totalExpense - totalInvestment });
    }
  }

  const cashflow = { nodes, links };

  return Response.json({
    stats,
    categoryBreakdown,
    trends,
    heatmap,
    cashflow
  });
}
