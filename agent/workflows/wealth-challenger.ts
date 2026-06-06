import { StateGraph } from "@langchain/langgraph";
import { ChatGroq } from "@langchain/groq";
import { SystemMessage, HumanMessage, BaseMessage } from "@langchain/core/messages";
import prisma from "@/lib/prisma";

export interface WealthChallengerState {
  userId: string;
  workspaceId?: string;
  action: "PROPOSE" | "CHECK";
  
  // Proposal fields
  recentTransactions?: any[];
  proposedChallenge?: {
    id: string;
    description: string;
    points: number;
    targetCategory: string;
    deadlineDays: number;
  };
  
  // Verification fields
  activeChallenge?: any;
  challengeResult?: "SUCCESS" | "FAILED" | "PENDING";
  
  awaitingUserInput: boolean;
  questionToUser?: string;
  finalMessage?: string;
  messages: BaseMessage[];
}

const challengerChannels = {
  userId: { value: (x: any, y: any) => y ?? x, default: () => "" },
  workspaceId: { value: (x: any, y: any) => y ?? x, default: () => undefined },
  action: { value: (x: any, y: any) => y ?? x, default: () => "PROPOSE" },
  recentTransactions: { value: (x: any, y: any) => y ?? x, default: () => undefined },
  proposedChallenge: { value: (x: any, y: any) => y ?? x, default: () => undefined },
  activeChallenge: { value: (x: any, y: any) => y ?? x, default: () => undefined },
  challengeResult: { value: (x: any, y: any) => y ?? x, default: () => undefined },
  awaitingUserInput: { value: (x: any, y: any) => y ?? x, default: () => false },
  questionToUser: { value: (x: any, y: any) => y ?? x, default: () => undefined },
  finalMessage: { value: (x: any, y: any) => y ?? x, default: () => undefined },
  messages: { value: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y), default: () => [] },
};

export function createWealthChallengerGraph() {
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) throw new Error("GROQ_API_KEY is missing");

  const model = new ChatGroq({
    apiKey: groqApiKey,
    model: "llama-3.3-70b-versatile",
    temperature: 0.5,
  });

  const analyzeNode = async (state: WealthChallengerState): Promise<any> => {
    if (state.action === "CHECK") return {};
    
    // User replied to our proposal
    if (state.awaitingUserInput && state.messages.length > 0) {
      const lastMsg = state.messages[state.messages.length - 1];
      if (lastMsg instanceof HumanMessage) {
        const text = (lastMsg.content as string).toLowerCase();
        if (text.includes("yes") || text.includes("accept") || text.includes("sure")) {
          // They accepted!
          return {
            activeChallenge: {
              ...state.proposedChallenge,
              startDate: new Date().toISOString(),
            },
            awaitingUserInput: false,
            questionToUser: undefined,
            finalMessage: `🎉 **Challenge Accepted!**\n\n${state.proposedChallenge?.description}\n\nI'll be monitoring your transactions. Use /challenge again to check your progress or claim your ${state.proposedChallenge?.points} XP reward later!`
          };
        } else {
          return {
            finalMessage: "No problem! You can ask for a new challenge anytime with /challenge."
          };
        }
      }
    }

    // Propose a new challenge
    const cutOff = new Date();
    cutOff.setDate(cutOff.getDate() - 14); // Look at last 14 days

    const txs = await prisma.transaction.findMany({
      where: { userId: state.userId, date: { gte: cutOff }, type: "expense" },
      orderBy: { date: "desc" }
    });

    const prompt = new SystemMessage(`You are a gamified financial coach. Look at the user's recent spending (last 14 days) and propose ONE specific, fun, short-term savings challenge.
Transactions: ${JSON.stringify(txs.slice(0, 20))}

For example, if they spend a lot on Coffee, challenge them: "Spend $0 on Coffee for the next 3 days."
Output ONLY a JSON object:
{
  "id": "unique-slug",
  "targetCategory": "Category Name (e.g. Coffee, Food, Shopping)",
  "deadlineDays": 3,
  "points": 500,
  "description": "Short description of the challenge"
}`);

    const res = await model.invoke([prompt]);
    const match = (res.content as string).match(/\{[\s\S]*\}/);
    if (!match) return { finalMessage: "Sorry, I couldn't come up with a challenge right now." };

    const proposed = JSON.parse(match[0]);
    return {
      proposedChallenge: proposed,
      awaitingUserInput: true,
      questionToUser: `🎮 **New Wealth Challenge!**\n\n${proposed.description}\n\n**Reward:** ${proposed.points} XP\n\nDo you accept this challenge? (Reply Yes or No)`
    };
  };

  const checkNode = async (state: WealthChallengerState): Promise<any> => {
    if (state.action === "PROPOSE") return {};

    const challenge = state.activeChallenge;
    if (!challenge) return { finalMessage: "You don't have an active challenge right now! Use /challenge to get one." };

    const startDate = new Date(challenge.startDate);
    const deadline = new Date(startDate);
    deadline.setDate(deadline.getDate() + challenge.deadlineDays);
    const now = new Date();

    // Check transactions since the challenge started
    const txs = await prisma.transaction.findMany({
      where: {
        userId: state.userId,
        date: { gte: startDate },
        type: "expense",
        category: { equals: challenge.targetCategory, mode: "insensitive" }
      }
    });

    if (txs.length > 0) {
      // They failed the challenge!
      return {
        challengeResult: "FAILED",
        finalMessage: `❌ **Challenge Failed!**\n\nYou spent money on ${challenge.targetCategory} since the challenge started. Better luck next time! Use /challenge for a new one.`
      };
    }

    if (now < deadline) {
      // Still in progress
      const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 3600 * 24));
      return {
        challengeResult: "PENDING",
        finalMessage: `⏳ **Challenge in Progress**\n\n${challenge.description}\n\nYou have ${daysLeft} day(s) left! Keep it up. You haven't spent anything on ${challenge.targetCategory} yet.`
      };
    }

    // Success!
    await prisma.userSettings.update({
      where: { userId: state.userId },
      data: { totalPoints: { increment: challenge.points } }
    });

    return {
      challengeResult: "SUCCESS",
      finalMessage: `🏆 **CHALLENGE COMPLETE!**\n\nYou successfully completed: ${challenge.description}.\n\nI have awarded you **${challenge.points} XP**! Use /challenge to get another one.`
    };
  };

  const shouldContinue = (state: any) => {
    if (state.finalMessage || state.awaitingUserInput) return "__end__";
    return "__end__";
  };

  const routeStart = (state: any) => {
    if (state.action === "CHECK") return "check";
    return "analyze";
  };

  const workflow = new StateGraph<any>({ channels: challengerChannels as any })
    .addNode("analyze", analyzeNode)
    .addNode("check", checkNode)
    .addConditionalEdges("__start__", routeStart)
    .addConditionalEdges("analyze", shouldContinue)
    .addConditionalEdges("check", shouldContinue);

  return workflow.compile();
}
