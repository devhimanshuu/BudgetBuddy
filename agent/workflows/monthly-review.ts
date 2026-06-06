import { StateGraph } from "@langchain/langgraph";
import { ChatGroq } from "@langchain/groq";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import prisma from "@/lib/prisma";
import { STRICT_ACCOUNTANT_PROMPT, LIFESTYLE_COACH_PROMPT, MODERATOR_PROMPT } from "../prompts/review-prompts";

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
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) throw new Error("GROQ_API_KEY is missing");

  const model = new ChatGroq({
    apiKey: groqApiKey,
    model: "llama-3.3-70b-versatile",
    temperature: 0.5,
  });

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
    const res = await model.invoke([
      new SystemMessage(STRICT_ACCOUNTANT_PROMPT),
      new HumanMessage(`Data for ${state.month}/${state.year}:\n${state.financialData}`)
    ]);
    return { accountantReport: res.content as string };
  };

  const coachNode = async (state: MonthlyReviewState) => {
    const res = await model.invoke([
      new SystemMessage(LIFESTYLE_COACH_PROMPT),
      new HumanMessage(`Data for ${state.month}/${state.year}:\n${state.financialData}`)
    ]);
    return { coachReport: res.content as string };
  };

  const synthesizeNode = async (state: MonthlyReviewState) => {
    const res = await model.invoke([
      new SystemMessage(MODERATOR_PROMPT),
      new HumanMessage(`Strict Accountant's Report:\n${state.accountantReport}\n\nLifestyle Coach's Report:\n${state.coachReport}`)
    ]);
    return { finalReport: res.content as string };
  };

  const workflow = new StateGraph<MonthlyReviewState>({ channels: reviewStateChannels })
    .addNode("gather", gatherDataNode)
    .addNode("accountant", accountantNode)
    .addNode("coach", coachNode)
    .addNode("synthesize", synthesizeNode)
    
    // In LangGraph, to run nodes in parallel, we can add edges from a single node to multiple nodes
    // and then gather them in the synthesize node.
    .addEdge("__start__", "gather")
    .addEdge("gather", "accountant")
    .addEdge("gather", "coach")
    .addEdge("accountant", "synthesize")
    .addEdge("coach", "synthesize")
    .addEdge("synthesize", "__end__");

  return workflow.compile();
}
