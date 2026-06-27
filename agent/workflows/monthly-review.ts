import { StateGraph } from "@langchain/langgraph";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import prisma from "@/lib/prisma";
import { STRICT_ACCOUNTANT_PROMPT, LIFESTYLE_COACH_PROMPT, MODERATOR_PROMPT } from "../prompts/review-prompts";
import { createChatModel } from "../model";

export interface MonthlyReviewState {
  userId: string;
  workspaceId: string | undefined;
  month: number;
  year: number;
  financialData: string;
  accountantReport: string;
  coachReport: string;
  finalReport: string;
}

const reviewStateChannels = {
  userId: { value: (x: string, y: string) => y ?? x, default: () => "" },
  workspaceId: { value: (x: string | undefined, y: string | undefined) => y ?? x, default: () => undefined },
  month: { value: (x: number, y: number) => y ?? x, default: () => new Date().getMonth() + 1 },
  year: { value: (x: number, y: number) => y ?? x, default: () => new Date().getFullYear() },
  financialData: { value: (x: string, y: string) => y ?? x, default: () => "" },
  accountantReport: { value: (x: string, y: string) => y ?? x, default: () => "" },
  coachReport: { value: (x: string, y: string) => y ?? x, default: () => "" },
  finalReport: { value: (x: string, y: string) => y ?? x, default: () => "" },
};

export function createMonthlyReviewGraph() {
  if (!process.env.GROQ_API_KEY && !process.env.OPENROUTER_API_KEY) {
    throw new Error("No LLM provider configured (set GROQ_API_KEY or OPENROUTER_API_KEY)");
  }

  const model = createChatModel({ temperature: 0.5 });

  const gatherDataNode = async (state: MonthlyReviewState) => {
    // 0-indexed for Date constructor, so month - 1
    const startDate = new Date(state.year, state.month - 1, 1);
    const endDate = new Date(state.year, state.month, 0, 23, 59, 59, 999);

    const [transactions, budgets] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          ...(state.workspaceId ? { workspaceId: state.workspaceId } : { userId: state.userId }),
          date: { gte: startDate, lte: endDate },
          deletedAt: null,
          status: "APPROVED",
        },
        select: { type: true, category: true, amount: true, description: true },
      }),
      prisma.budget.findMany({
        where: {
          ...(state.workspaceId ? { workspaceId: state.workspaceId } : { userId: state.userId }),
          month: state.month,
          year: state.year,
        },
        select: { category: true, amount: true },
      }),
    ]);

    const financialData = JSON.stringify({ transactions, budgets }, null, 2);
    return { financialData };
  };

  const accountantNode = async (state: MonthlyReviewState) => {
    try {
      const res = await model.invoke([
        new SystemMessage(STRICT_ACCOUNTANT_PROMPT),
        new HumanMessage(`Data for ${state.month}/${state.year}:\n${state.financialData}`)
      ]);
      return { accountantReport: res.content as string };
    } catch (e: any) {
      console.error("Accountant node error:", e);
      return { accountantReport: `Unable to generate accountant report: ${e.message}` };
    }
  };

  const coachNode = async (state: MonthlyReviewState) => {
    try {
      const res = await model.invoke([
        new SystemMessage(LIFESTYLE_COACH_PROMPT),
        new HumanMessage(`Data for ${state.month}/${state.year}:\n${state.financialData}`)
      ]);
      return { coachReport: res.content as string };
    } catch (e: any) {
      console.error("Coach node error:", e);
      return { coachReport: `Unable to generate coach report: ${e.message}` };
    }
  };

  const synthesizeNode = async (state: MonthlyReviewState) => {
    try {
      const res = await model.invoke([
        new SystemMessage(MODERATOR_PROMPT),
        new HumanMessage(`Strict Accountant's Report:\n${state.accountantReport}\n\nLifestyle Coach's Report:\n${state.coachReport}`)
      ]);
      return { finalReport: res.content as string };
    } catch (e: any) {
      console.error("Synthesize node error:", e);
      // Fallback: combine both reports manually
      const fallback = `📊 **Monthly Financial Review - ${state.month}/${state.year}**

**Accountant's Analysis:**
${state.accountantReport}

**Coach's Analysis:**
${state.coachReport}`;
      return { finalReport: fallback };
    }
  };

  const workflow = new StateGraph<MonthlyReviewState>({ channels: reviewStateChannels })
    .addNode("gather", gatherDataNode)
    .addNode("accountant", accountantNode)
    .addNode("coach", coachNode)
    .addNode("synthesize", synthesizeNode)
    
    // Run sequentially: gather -> accountant -> coach -> synthesize
    // This avoids parallel edge issues in LangGraph where state updates can conflict
    .addEdge("__start__", "gather")
    .addEdge("gather", "accountant")
    .addEdge("accountant", "coach")
    .addEdge("coach", "synthesize")
    .addEdge("synthesize", "__end__");

  return workflow.compile();
}
