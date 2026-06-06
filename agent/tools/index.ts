import prisma from "@/lib/prisma";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

/**
 * Creates the set of LangChain tools bound to a specific user and workspace.
 */
export function createTools(userId: string, workspaceId?: string) {
  return [
    // 1. Get Recent Transactions
    new DynamicStructuredTool({
      name: "get_recent_transactions",
      description: "Retrieve recent transactions for the user. Allows filtering by days, category, and type (income/expense/investment).",
      schema: z.object({
        days: z.number().default(30).describe("Number of days in the past to search"),
        category: z.string().optional().describe("Filter by category name (case-insensitive)"),
        type: z.enum(["income", "expense", "investment"]).optional().describe("Filter by transaction type"),
        limit: z.number().default(50).describe("Maximum number of transactions to return"),
      }),
      func: async ({ days, category, type, limit }) => {
        try {
          const cutOffDate = new Date();
          cutOffDate.setDate(cutOffDate.getDate() - days);

          const transactions = await prisma.transaction.findMany({
            where: {
              ...(workspaceId ? { workspaceId } : { userId }),
              date: { gte: cutOffDate },
              deletedAt: null,
              ...(type ? { type } : {}),
              ...(category ? { category: { equals: category, mode: "insensitive" } } : {}),
            },
            orderBy: { date: "desc" },
            take: limit,
          });

          if (transactions.length === 0) {
            return "No transactions found matching the criteria.";
          }

          return JSON.stringify(
            transactions.map((t) => ({
              id: t.id,
              date: t.date.toISOString().split("T")[0],
              amount: t.amount,
              type: t.type,
              category: t.category,
              description: t.description,
              notes: t.notes,
              status: t.status,
            })),
            null,
            2
          );
        } catch (error: any) {
          return `Error retrieving transactions: ${error.message}`;
        }
      },
    }),

    // 2. Get Category Budgets
    new DynamicStructuredTool({
      name: "get_category_budgets",
      description: "Retrieve category budgets for a specific month and year. Defaults to the current month and year.",
      schema: z.object({
        month: z.number().optional().describe("1-indexed month (1-12)"),
        year: z.number().optional().describe("4-digit year (e.g. 2026)"),
      }),
      func: async ({ month, year }) => {
        try {
          const now = new Date();
          const targetMonth = month !== undefined ? month : now.getMonth() + 1; // 1-indexed in UI/args, 0-indexed in JS Date
          const targetYear = year !== undefined ? year : now.getFullYear();

          const budgets = await prisma.budget.findMany({
            where: {
              ...(workspaceId ? { workspaceId } : { userId }),
              month: targetMonth,
              year: targetYear,
              deletedAt: null,
            },
            select: {
              category: true,
              categoryIcon: true,
              amount: true,
            },
          });

          if (budgets.length === 0) {
            return `No budgets configured for ${targetMonth}/${targetYear}.`;
          }

          return JSON.stringify(budgets, null, 2);
        } catch (error: any) {
          return `Error retrieving budgets: ${error.message}`;
        }
      },
    }),

    // 3. Get Savings Goals
    new DynamicStructuredTool({
      name: "get_savings_goals",
      description: "Retrieve active savings goals, their targets, current amounts, and deadlines.",
      schema: z.object({}),
      func: async () => {
        try {
          const goals = await prisma.savingsGoal.findMany({
            where: {
              ...(workspaceId ? { workspaceId } : { userId }),
              deletedAt: null,
            },
            orderBy: { targetDate: "asc" },
          });

          if (goals.length === 0) {
            return "No active savings goals found.";
          }

          return JSON.stringify(
            goals.map((g) => ({
              id: g.id,
              name: g.name,
              description: g.description,
              targetAmount: g.targetAmount,
              currentAmount: g.currentAmount,
              targetDate: g.targetDate.toISOString().split("T")[0],
              category: g.category,
              icon: g.icon,
              isCompleted: g.isCompleted,
            })),
            null,
            2
          );
        } catch (error: any) {
          return `Error retrieving savings goals: ${error.message}`;
        }
      },
    }),

    // 4. Get User Financial Summary
    new DynamicStructuredTool({
      name: "get_financial_summary",
      description: "Get a quick summary of total income, expense, and net balance for the current calendar month.",
      schema: z.object({}),
      func: async () => {
        try {
          const now = new Date();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

          const transactions = await prisma.transaction.findMany({
            where: {
              ...(workspaceId ? { workspaceId } : { userId }),
              date: {
                gte: startOfMonth,
                lte: endOfMonth,
              },
              deletedAt: null,
              status: "APPROVED",
            },
            select: {
              amount: true,
              type: true,
            },
          });

          let income = 0;
          let expense = 0;
          let investment = 0;

          transactions.forEach((t) => {
            if (t.type === "income") income += t.amount;
            else if (t.type === "expense") expense += t.amount;
            else if (t.type === "investment") investment += t.amount;
          });

          const summary = {
            month: now.toLocaleString("default", { month: "long" }),
            year: now.getFullYear(),
            totalIncome: income,
            totalExpense: expense,
            totalInvestment: investment,
            netBalance: income - expense - investment,
          };

          return JSON.stringify(summary, null, 2);
        } catch (error: any) {
          return `Error generating financial summary: ${error.message}`;
        }
      },
    }),

    // 5. Add Transaction
    new DynamicStructuredTool({
      name: "add_transaction",
      description: "Add a new financial transaction (income, expense, or investment).",
      schema: z.object({
        amount: z.number().describe("The numeric amount of the transaction"),
        category: z.string().describe("The category name (e.g. Food, Shopping, Salary)"),
        type: z.enum(["income", "expense", "investment"]).describe("Type of transaction"),
        description: z.string().describe("Short description of the transaction"),
        date: z.string().optional().describe("Date of the transaction in YYYY-MM-DD format. Defaults to today."),
        notes: z.string().optional().describe("Optional detailed notes"),
      }),
      func: async ({ amount, category, type, description, date, notes }) => {
        try {
          const txnDate = date ? new Date(date) : new Date();

          // 1. Find or create the category in the workspace/user
          let categoryRow = await prisma.category.findFirst({
            where: {
              ...(workspaceId ? { workspaceId } : { userId }),
              name: { equals: category, mode: "insensitive" },
              deletedAt: null,
            },
          });

          if (!categoryRow) {
            // Create a default category
            let defaultIcon = "💸";
            if (category.toLowerCase().includes("food") || category.toLowerCase().includes("dine") || category.toLowerCase().includes("restaurant")) defaultIcon = "🍔";
            else if (category.toLowerCase().includes("coffee") || category.toLowerCase().includes("cafe")) defaultIcon = "☕";
            else if (category.toLowerCase().includes("shopping") || category.toLowerCase().includes("cloth")) defaultIcon = "🛍️";
            else if (category.toLowerCase().includes("salary") || category.toLowerCase().includes("income") || category.toLowerCase().includes("pay")) defaultIcon = "💰";
            else if (category.toLowerCase().includes("rent") || category.toLowerCase().includes("house") || category.toLowerCase().includes("home")) defaultIcon = "🏠";
            else if (category.toLowerCase().includes("travel") || category.toLowerCase().includes("trip") || category.toLowerCase().includes("flight")) defaultIcon = "✈️";
            else if (category.toLowerCase().includes("taxi") || category.toLowerCase().includes("ride") || category.toLowerCase().includes("car") || category.toLowerCase().includes("uber")) defaultIcon = "🚗";
            else if (category.toLowerCase().includes("sub") || category.toLowerCase().includes("netflix") || category.toLowerCase().includes("spotify") || category.toLowerCase().includes("bill")) defaultIcon = "📡";

            categoryRow = await prisma.category.create({
              data: {
                userId,
                workspaceId: workspaceId || null,
                name: category.charAt(0).toUpperCase() + category.slice(1),
                icon: defaultIcon,
                color: "#10b981", // default emerald
                type,
              },
            });
          }

          // 2. Perform DB operations in a transaction
          const createdTx = await prisma.$transaction(async (tx) => {
            const transaction = await tx.transaction.create({
              data: {
                userId,
                workspaceId: workspaceId || null,
                amount,
                date: txnDate,
                description,
                notes: notes || null,
                type,
                category: categoryRow!.name,
                categoryIcon: categoryRow!.icon,
                status: "APPROVED",
              },
            });

            // Update monthly aggregates
            await tx.monthlyHistory.upsert({
              where: {
                day_month_year_userId: {
                  userId,
                  day: txnDate.getUTCDate(),
                  month: txnDate.getUTCMonth(),
                  year: txnDate.getUTCFullYear(),
                },
              },
              create: {
                userId,
                workspaceId: workspaceId || null,
                day: txnDate.getUTCDate(),
                month: txnDate.getUTCMonth(),
                year: txnDate.getUTCFullYear(),
                expense: type === "expense" ? amount : 0,
                income: type === "income" ? amount : 0,
                investment: type === "investment" ? amount : 0,
              },
              update: {
                workspaceId: workspaceId || null,
                expense: { increment: type === "expense" ? amount : 0 },
                income: { increment: type === "income" ? amount : 0 },
                investment: { increment: type === "investment" ? amount : 0 },
              },
            });

            // Update annual aggregates
            await tx.yearHistory.upsert({
              where: {
                month_year_userId: {
                  userId,
                  month: txnDate.getUTCMonth(),
                  year: txnDate.getUTCFullYear(),
                },
              },
              create: {
                userId,
                workspaceId: workspaceId || null,
                month: txnDate.getUTCMonth(),
                year: txnDate.getUTCFullYear(),
                expense: type === "expense" ? amount : 0,
                income: type === "income" ? amount : 0,
                investment: type === "investment" ? amount : 0,
              },
              update: {
                workspaceId: workspaceId || null,
                expense: { increment: type === "expense" ? amount : 0 },
                income: { increment: type === "income" ? amount : 0 },
                investment: { increment: type === "investment" ? amount : 0 },
              },
            });

            return transaction;
          });

          return `Successfully added transaction: ${createdTx.type} of ${amount} in ${createdTx.category} on ${createdTx.date.toISOString().split("T")[0]} (${description}).`;
        } catch (error: any) {
          return `Error adding transaction: ${error.message}`;
        }
      },
    }),

    // 6. Update Budget
    new DynamicStructuredTool({
      name: "update_budget",
      description: "Set or update a budget limit for a category in a specific month and year.",
      schema: z.object({
        category: z.string().describe("The category name to assign a budget to"),
        amount: z.number().describe("The maximum budget amount"),
        month: z.number().optional().describe("1-indexed month (1-12). Defaults to current month."),
        year: z.number().optional().describe("4-digit year. Defaults to current year."),
      }),
      func: async ({ category, amount, month, year }) => {
        try {
          const now = new Date();
          const targetMonth = month !== undefined ? month : now.getMonth() + 1;
          const targetYear = year !== undefined ? year : now.getFullYear();

          // Try to find matching category to get its icon
          const categoryRow = await prisma.category.findFirst({
            where: {
              ...(workspaceId ? { workspaceId } : { userId }),
              name: { equals: category, mode: "insensitive" },
              deletedAt: null,
            },
          });

          const icon = categoryRow ? categoryRow.icon : "🍔";
          const resolvedCategoryName = categoryRow ? categoryRow.name : category.charAt(0).toUpperCase() + category.slice(1);

          await prisma.budget.upsert({
            where: {
              userId_category_month_year: {
                userId,
                category: resolvedCategoryName,
                month: targetMonth,
                year: targetYear,
              },
            },
            create: {
              userId,
              workspaceId: workspaceId || null,
              category: resolvedCategoryName,
              categoryIcon: icon,
              amount,
              month: targetMonth,
              year: targetYear,
            },
            update: {
              amount,
              categoryIcon: icon,
              workspaceId: workspaceId || null,
              deletedAt: null,
            },
          });

          return `Successfully set budget for category ${resolvedCategoryName} to ${amount} for ${targetMonth}/${targetYear}.`;
        } catch (error: any) {
          return `Error updating budget: ${error.message}`;
        }
      },
    }),

    // 7. Add Savings Contribution
    new DynamicStructuredTool({
      name: "add_savings_contribution",
      description: "Contribute an amount toward an existing savings goal by name.",
      schema: z.object({
        goalName: z.string().describe("The exact name of the savings goal"),
        amount: z.number().describe("The contribution amount"),
      }),
      func: async ({ goalName, amount }) => {
        try {
          const goal = await prisma.savingsGoal.findFirst({
            where: {
              ...(workspaceId ? { workspaceId } : { userId }),
              name: { equals: goalName, mode: "insensitive" },
              deletedAt: null,
            },
          });

          if (!goal) {
            return `Savings goal "${goalName}" was not found. Please verify the goal name.`;
          }

          const updatedGoal = await prisma.$transaction(async (tx) => {
            // Create goal contribution entry
            await tx.goalContribution.create({
              data: {
                goalId: goal.id,
                userId,
                amount,
              },
            });

            // Update goal current amount
            const newAmount = goal.currentAmount + amount;
            const isCompleted = newAmount >= goal.targetAmount;

            const updated = await tx.savingsGoal.update({
              where: { id: goal.id },
              data: {
                currentAmount: newAmount,
                isCompleted,
              },
            });

            return updated;
          });

          return `Successfully contributed ${amount} to goal "${goal.name}". New progress: ${updatedGoal.currentAmount}/${updatedGoal.targetAmount}.`;
        } catch (error: any) {
          return `Error adding savings contribution: ${error.message}`;
        }
      },
    }),

    // 8. Get Recurring Transactions
    new DynamicStructuredTool({
      name: "get_recurring_transactions",
      description: "Retrieve all recurring bills, subscriptions, or scheduled income/expenses.",
      schema: z.object({}),
      func: async () => {
        try {
          const recurring = await prisma.recurringTransaction.findMany({
            where: {
              ...(workspaceId ? { workspaceId } : { userId }),
              deletedAt: null,
            },
            orderBy: { date: "asc" },
          });

          if (recurring.length === 0) {
            return "No recurring transactions or subscriptions found.";
          }

          return JSON.stringify(
            recurring.map((r) => ({
              id: r.id,
              description: r.description,
              amount: r.amount,
              type: r.type,
              category: r.category,
              interval: r.interval,
              nextDueDate: r.date.toISOString().split("T")[0],
              isAutoProcess: r.isAuto,
              lastProcessed: r.lastProcessed ? r.lastProcessed.toISOString().split("T")[0] : null,
            })),
            null,
            2
          );
        } catch (error: any) {
          return `Error retrieving recurring transactions: ${error.message}`;
        }
      },
    }),

    // 9. Savings Planner Sub-Graph Tool
    new DynamicStructuredTool({
      name: "plan_real_world_savings_goal",
      description: "Use this tool ONLY when the user explicitly asks to plan, research, or save for a specific real-world goal (like a trip, car, or wedding). It will perform web research to find real costs and auto-create a realistic savings goal for them.",
      schema: z.object({
        userMessage: z.string().describe("The exact message from the user describing what they want to save for"),
      }),
      func: async ({ userMessage }) => {
        try {
          const { createSavingsPlannerGraph } = await import("../workflows/savings-planner");
          const graph = createSavingsPlannerGraph();
          const finalState = await graph.invoke({
            userId,
            workspaceId,
            userMessage,
          } as any);
          return finalState.finalMessage || "Successfully researched and created the savings goal.";
        } catch (error: any) {
          return `Error planning savings goal: ${error.message}`;
        }
      },
    }),

    // 10. Splitwise Debt Negotiator Tool
    new DynamicStructuredTool({
      name: "check_splitwise_debts",
      description: "Use this tool to check Splitwise for friends who owe the user money and automatically draft polite reminder text messages.",
      schema: z.object({}),
      func: async () => {
        try {
          const { createDebtNegotiatorGraph } = await import("../workflows/debt-negotiator");
          const graph = createDebtNegotiatorGraph();
          const finalState = await graph.invoke({
            userId,
            friends: [],
            overdueDebtors: [],
            draftedReminders: [],
            finalReport: null,
          } as any);
          return finalState.finalReport || "No outstanding debts found.";
        } catch (error: any) {
          return `Error checking Splitwise: ${error.message}`;
        }
      },
    }),

    // 11. Subscription Advisor Tool
    new DynamicStructuredTool({
      name: "check_subscriptions",
      description: "Use this tool when the user asks to review their subscriptions, find better deals, or cancel recurring bills. It will research cheaper alternatives and draft negotiation scripts.",
      schema: z.object({}),
      func: async () => {
        try {
          const { createSubscriptionAdvisorGraph } = await import("../workflows/subscription-advisor");
          const graph = createSubscriptionAdvisorGraph();
          const finalState = await graph.invoke({
            userId,
            workspaceId,
            subscriptions: [],
            researchResults: [],
            finalReport: null,
          } as any);
          return finalState.finalReport || "No active subscriptions found.";
        } catch (error: any) {
          return `Error checking subscriptions: ${error.message}`;
        }
      },
    }),

    // 12. Monthly Review Sub-Graph Tool
    new DynamicStructuredTool({
      name: "generate_monthly_review",
      description: "Use this tool to generate a comprehensive Multi-Agent Monthly Financial Review. It uses a 'Good Cop / Bad Cop' analysis approach to critique spending and praise good habits.",
      schema: z.object({
        month: z.number().optional().describe("1-indexed month (1-12). Defaults to current month."),
        year: z.number().optional().describe("4-digit year. Defaults to current year."),
      }),
      func: async ({ month, year }) => {
        try {
          const now = new Date();
          const targetMonth = month !== undefined ? month : now.getMonth() + 1;
          const targetYear = year !== undefined ? year : now.getFullYear();

          const { createMonthlyReviewGraph } = await import("../workflows/monthly-review");
          const graph = createMonthlyReviewGraph();
          const finalState = await graph.invoke({
            userId,
            workspaceId,
            month: targetMonth,
            year: targetYear,
            financialData: "",
            accountantReport: "",
            coachReport: "",
            finalReport: "",
          } as any);
          return finalState.finalReport || "Review completed but no report was generated.";
        } catch (error: any) {
          return `Error generating monthly review: ${error.message}`;
        }
      },
    }),
  ];
}
