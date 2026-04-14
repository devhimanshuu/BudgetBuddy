import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getActiveWorkspace } from "@/lib/workspaces";

export async function GET(request: Request) {
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const workspace = await getActiveWorkspace();
  const workspaceId = workspace?.id;
  const whereUserIdOrWorkspaceId = workspaceId ? { workspaceId } : { userId: user.id };

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const currentMonthStart = new Date(currentYear, currentMonth, 1);
  const currentMonthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
  
  const previousMonthStart = new Date(previousYear, previousMonth, 1);
  const previousMonthEnd = new Date(previousYear, previousMonth + 1, 0, 23, 59, 59);

  // Fire parallel database queries
  const [
    currentMonthHistory,
    previousMonthHistory,
    currentExpenses,
    previousExpenses,
    recentTransactions,
    activities,
    budgets,
    savingsGoals,
    membersCount
  ] = await Promise.all([
    // 1. Stats and Savings
    prisma.monthlyHistory.findMany({
      where: { ...whereUserIdOrWorkspaceId, month: currentMonth, year: currentYear },
    }),
    prisma.monthlyHistory.findMany({
      where: { ...whereUserIdOrWorkspaceId, month: previousMonth, year: previousYear },
    }),
    
    // 2. Spending Trends & Top Categories & Budget Overview (Current)
    prisma.transaction.findMany({
      where: { ...whereUserIdOrWorkspaceId, status: "APPROVED", type: { in: ["expense", "investment"] }, date: { lte: currentMonthEnd, gte: currentMonthStart } },
      include: { splits: true },
    }),
    // 3. Spending Trends (Previous)
    prisma.transaction.findMany({
      where: { ...whereUserIdOrWorkspaceId, status: "APPROVED", type: { in: ["expense", "investment"] }, date: { lte: previousMonthEnd, gte: previousMonthStart } },
      include: { splits: true },
    }),

    // 4. Recent Transactions
    prisma.transaction.findMany({
      where: { ...whereUserIdOrWorkspaceId, status: "APPROVED" },
      orderBy: { date: "desc" },
      take: 5,
    }),

    // 5. Activities
    workspaceId ? prisma.activity.findMany({
      where: { 
        workspaceId,
        ...(workspace?.role !== "ADMIN" ? { 
          userId: { in: [user.id, workspace.ownerId] } 
        } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }).catch(() => []) : Promise.resolve([]),

    // 6. Budgets
    prisma.budget.findMany({
      where: { ...whereUserIdOrWorkspaceId, month: currentMonth, year: currentYear },
    }),

    // 7. Savings Goals
    prisma.savingsGoal.findMany({
      where: { ...whereUserIdOrWorkspaceId },
      orderBy: [{ isCompleted: "asc" }, { targetDate: "asc" }],
    }),

    // 8. Workspace Members Count
    workspaceId ? prisma.workspaceMember.count({
      where: { workspaceId }
    }) : Promise.resolve(1)
  ]);

  // --- Compute Stats & Savings ---
  const currentIncome = currentMonthHistory.reduce((sum, s) => sum + s.income, 0);
  const currentExpense = currentMonthHistory.reduce((sum, s) => sum + s.expense, 0);
  const currentInvestment = currentMonthHistory.reduce((sum, s) => sum + s.investment, 0);
  const previousIncome = previousMonthHistory.reduce((sum, s) => sum + s.income, 0);
  const previousExpense = previousMonthHistory.reduce((sum, s) => sum + s.expense, 0);
  const previousInvestment = previousMonthHistory.reduce((sum, s) => sum + s.investment, 0);

  const currentBalance = currentIncome - currentExpense - currentInvestment;
  const previousBalance = previousIncome - previousExpense - previousInvestment;

  const currentSavingsRate = currentIncome > 0 ? (currentBalance / currentIncome) * 100 : 0;
  const previousSavingsRate = previousIncome > 0 ? (previousBalance / previousIncome) * 100 : 0;

  const stats = {
    income: currentIncome,
    expense: currentExpense,
    investment: currentInvestment,
    balance: currentBalance,
    previousBalance,
    savings: currentBalance, // Added for SavingsRate
    savingsRate: currentSavingsRate, // Added for SavingsRate
    previousSavingsRate, // Added for SavingsRate
    rateChange: currentSavingsRate - previousSavingsRate, // Added for SavingsRate
  };

  // --- Compute Categories, Trends, and Budget Progress ---
  const currentSpendingByCategory = new Map<string, { amount: number; icon: string }>();
  currentExpenses.forEach((t) => {
    if (t.splits && t.splits.length > 0) {
      t.splits.forEach(split => {
        const existing = currentSpendingByCategory.get(split.category) || { amount: 0, icon: t.categoryIcon };
        currentSpendingByCategory.set(split.category, { amount: existing.amount + split.amount, icon: t.categoryIcon }); // Assumption: splits use same icon as parent if unsupported? Assuming existing uses correct icon
      });
    } else {
      const existing = currentSpendingByCategory.get(t.category) || { amount: 0, icon: t.categoryIcon };
      currentSpendingByCategory.set(t.category, { amount: existing.amount + t.amount, icon: t.categoryIcon });
    }
  });

  const previousSpendingByCategory = new Map<string, number>();
  previousExpenses.forEach((t) => {
    if (t.splits && t.splits.length > 0) {
      t.splits.forEach(split => {
        previousSpendingByCategory.set(split.category, (previousSpendingByCategory.get(split.category) || 0) + split.amount);
      });
    } else {
      previousSpendingByCategory.set(t.category, (previousSpendingByCategory.get(t.category) || 0) + t.amount);
    }
  });

  const totalCurrentSpending = Array.from(currentSpendingByCategory.values()).reduce((sum, cat) => sum + cat.amount, 0);
  
  const topCategories = Array.from(currentSpendingByCategory.entries())
    .map(([category, data]) => ({
      category,
      categoryIcon: data.icon,
      amount: data.amount,
      percentage: totalCurrentSpending > 0 ? (data.amount / totalCurrentSpending) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const trends = Array.from(currentSpendingByCategory.entries()).map(([category, data]) => {
    const previousAmount = previousSpendingByCategory.get(category) || 0;
    const change = data.amount - previousAmount;
    const changePercent = previousAmount > 0 ? (change / previousAmount) * 100 : 100;
    return {
      category,
      categoryIcon: data.icon,
      currentMonth: data.amount,
      previousMonth: previousAmount,
      change,
      changePercent,
    };
  }).sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));

  // Compute Budgets
  const budgetProgress = budgets.map((budget) => {
    const spent = currentSpendingByCategory.get(budget.category)?.amount || 0;
    const remaining = budget.amount - spent;
    const percentage = (spent / budget.amount) * 100;

    const daysPassed = Math.max(1, now.getDate() - currentMonthStart.getDate() + 1);
    const totalDaysInMonth = currentMonthEnd.getDate();
    const daysRemaining = Math.max(0, totalDaysInMonth - daysPassed);

    const dailySpendingRate = spent / daysPassed;
    const projectedSpending = dailySpendingRate * totalDaysInMonth;
    const projectedOverspend = Math.max(0, projectedSpending - budget.amount);

    return {
      id: `${budget.userId}-${budget.category}-${budget.month}-${budget.year}`,
      category: budget.category,
      categoryIcon: budget.categoryIcon,
      budgetAmount: budget.amount,
      spent,
      remaining,
      percentage: Math.min(percentage, 100),
      isOverBudget: spent > budget.amount,
      isNearLimit: percentage >= 80 && percentage < 100,
      projectedSpending,
      projectedOverspend,
      isProjectedToOverspend: projectedSpending > budget.amount,
      dailySpendingRate,
      daysRemaining,
    };
  });

  return Response.json({
    stats,
    topCategories,
    trends,
    recentTransactions,
    activities,
    budgetProgress,
    savingsGoals,
    currency: workspace?.currency || "USD",
    isCollaborative: (workspaceId && membersCount > 1) || false
  });
}
