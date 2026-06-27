import { StateGraph } from "@langchain/langgraph";
import { SystemMessage, HumanMessage, BaseMessage } from "@langchain/core/messages";
import { ExtractReceiptData } from "@/app/(dashboard)/_actions/extractReceipt";
import prisma from "@/lib/prisma";
import { createChatModel } from "../model";

export interface ReceiptScannerState {
  userId: string;
  workspaceId?: string;
  imageBase64: string;
  extractedData?: {
    merchant?: string;
    amount?: number;
    category?: string;
    items?: string[];
  };
  isGroupMeal: boolean;
  friendsToSplitWith?: string[];
  awaitingUserInput: boolean;
  questionToUser?: string;
  finalMessage?: string;
  messages: BaseMessage[];
}

const receiptStateChannels = {
  userId: { value: (x: any, y: any) => y ?? x, default: () => "" },
  workspaceId: { value: (x: any, y: any) => y ?? x, default: () => undefined },
  imageBase64: { value: (x: any, y: any) => y ?? x, default: () => "" },
  extractedData: { value: (x: any, y: any) => y ?? x, default: () => undefined },
  isGroupMeal: { value: (x: any, y: any) => y ?? x, default: () => false },
  friendsToSplitWith: { value: (x: any, y: any) => y ?? x, default: () => undefined },
  awaitingUserInput: { value: (x: any, y: any) => y ?? x, default: () => false },
  questionToUser: { value: (x: any, y: any) => y ?? x, default: () => undefined },
  finalMessage: { value: (x: any, y: any) => y ?? x, default: () => undefined },
  messages: { value: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y), default: () => [] },
};

export function createReceiptScannerGraph() {
  if (!process.env.GROQ_API_KEY && !process.env.OPENROUTER_API_KEY) {
    throw new Error("No LLM provider configured (set GROQ_API_KEY or OPENROUTER_API_KEY)");
  }

  const model = createChatModel({ temperature: 0.1 });

  const extractNode = async (state: ReceiptScannerState): Promise<any> => {
    if (state.extractedData) return {}; // Already extracted
    
    const extraction = await ExtractReceiptData(state.imageBase64);
    if (!extraction.success || !extraction.data) {
      return { finalMessage: "❌ Sorry, I couldn't read the receipt clearly. Please type it manually." };
    }
    
    return { extractedData: extraction.data };
  };

  const analyzeSplitNode = async (state: ReceiptScannerState): Promise<any> => {
    if (!state.extractedData) return {};
    
    // If the user just replied with friends
    if (state.awaitingUserInput && state.messages.length > 0) {
      const lastMsg = state.messages[state.messages.length - 1];
      if (lastMsg && ((lastMsg as any)._type === "human" || (lastMsg as any).type === "human" || lastMsg instanceof HumanMessage)) {
        const text = typeof lastMsg.content === "string" ? lastMsg.content : String(lastMsg.content);
        if (text.toLowerCase() === "no" || text.toLowerCase() === "nope") {
          return {
            isGroupMeal: false,
            awaitingUserInput: false,
            questionToUser: undefined,
          };
        }
        
        // Extract names
        const prompt = new SystemMessage(`The user was asked who they are splitting a bill with.
User replied: "${text}"
Extract the names of the friends as a JSON array of strings. If no names, return an empty array.
Output ONLY valid JSON like: ["Alice", "Bob"]`);
        const res = await model.invoke([prompt]);
        const jsonMatch = (res.content as string).match(/\[[\s\S]*\]/);
        let friends: string[] = [];
        if (jsonMatch) {
          try {
            friends = JSON.parse(jsonMatch[0]);
          } catch (e) {}
        }
        
        return {
          isGroupMeal: friends.length > 0,
          friendsToSplitWith: friends,
          awaitingUserInput: false,
          questionToUser: undefined,
        };
      }
    }
    // If we were awaiting input but couldn't parse the message, default to no split
    if (state.awaitingUserInput && state.messages.length > 0) {
      return {
        isGroupMeal: false,
        friendsToSplitWith: [],
        awaitingUserInput: false,
        questionToUser: undefined,
      };
    }

    // Determine if it looks like a group meal based on items
    const items = state.extractedData.items || [];
    if (items.length > 0 && !state.isGroupMeal && state.friendsToSplitWith === undefined) {
      const prompt = new SystemMessage(`Analyze these receipt items: ${JSON.stringify(items)}.
Does it look like a group expense (e.g., multiple entrees, multiple people's drinks)?
Output ONLY 'yes' or 'no'.`);
      const res = await model.invoke([prompt]);
      const content = (res.content as string).toLowerCase();
      
      if (content.includes("yes")) {
        return {
          isGroupMeal: true,
          awaitingUserInput: true,
          questionToUser: `I noticed there are multiple items on this $${state.extractedData.amount} receipt. Should I split this with anyone? (Reply with their names or say 'no')`
        };
      }
    }
    
    return { isGroupMeal: false };
  };

  const executeNode = async (state: ReceiptScannerState): Promise<any> => {
    if (!state.extractedData) return {};
    const { amount, category, merchant } = state.extractedData;

    const txnCategory = category || "Other";
    const txnAmount = amount || 0;
    const txnMerchant = merchant || "Store";

    if (txnAmount <= 0) {
      return { finalMessage: "❌ Could not determine a valid amount from the receipt. Please log it manually." };
    }

    try {
      // Auto-create category if needed
      let categoryRow = await prisma.category.findFirst({
        where: { userId: state.userId, name: { equals: txnCategory, mode: "insensitive" }, deletedAt: null },
      });
      if (!categoryRow) {
        categoryRow = await prisma.category.create({
          data: { userId: state.userId, workspaceId: state.workspaceId || null, name: txnCategory, icon: "🧾", color: "#3b82f6", type: "expense" },
        });
      }

      const date = new Date();
      await prisma.$transaction(async (tx) => {
        await tx.transaction.create({
          data: {
            userId: state.userId,
            workspaceId: state.workspaceId || null,
            amount: txnAmount,
            description: `${txnMerchant} (receipt scan)`,
            date,
            type: "expense",
            category: categoryRow!.name,
            categoryIcon: categoryRow!.icon,
            status: "APPROVED",
          },
        });

        await tx.monthlyHistory.upsert({
          where: { day_month_year_userId: { userId: state.userId, day: date.getUTCDate(), month: date.getUTCMonth(), year: date.getUTCFullYear() } },
          create: { userId: state.userId, workspaceId: state.workspaceId || null, day: date.getUTCDate(), month: date.getUTCMonth(), year: date.getUTCFullYear(), expense: txnAmount, income: 0, investment: 0 },
          update: { expense: { increment: txnAmount } },
        });

        await tx.yearHistory.upsert({
          where: { month_year_userId: { userId: state.userId, month: date.getUTCMonth(), year: date.getUTCFullYear() } },
          create: { userId: state.userId, workspaceId: state.workspaceId || null, month: date.getUTCMonth(), year: date.getUTCFullYear(), expense: txnAmount, income: 0, investment: 0 },
          update: { expense: { increment: txnAmount } },
        });
      });

      let finalMsg = `✅ Recorded $${txnAmount} for ${txnCategory} at ${txnMerchant}.`;

      if (state.isGroupMeal && state.friendsToSplitWith && state.friendsToSplitWith.length > 0) {
        const numPeople = state.friendsToSplitWith.length + 1;
        const splitAmount = (txnAmount / numPeople).toFixed(2);
        finalMsg += `\n\nI also marked that you split this with ${state.friendsToSplitWith.join(", ")}. They each owe you $${splitAmount}.`;
      }

      return { finalMessage: finalMsg };
    } catch (error: any) {
      console.error("Receipt transaction save error:", error);
      return { finalMessage: `⚠️ Receipt read: $${txnAmount} for ${txnCategory} at ${txnMerchant}, but failed to save: ${error.message}` };
    }
  };

  const shouldContinue = (state: ReceiptScannerState) => {
    if (state.finalMessage) return "__end__";
    if (state.awaitingUserInput) return "__end__"; // Pause for user input
    return "execute_transaction";
  };

  const workflow = new StateGraph<ReceiptScannerState>({ channels: receiptStateChannels })
    .addNode("extract_data", extractNode)
    .addNode("analyze_split", analyzeSplitNode)
    .addNode("execute_transaction", executeNode)
    .addEdge("__start__", "extract_data")
    .addEdge("extract_data", "analyze_split")
    .addConditionalEdges("analyze_split", shouldContinue)
    .addEdge("execute_transaction", "__end__");

  return workflow.compile();
}
