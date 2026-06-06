import { StateGraph } from "@langchain/langgraph";
import { ChatGroq } from "@langchain/groq";
import { SystemMessage } from "@langchain/core/messages";
import { TavilySearch } from "@langchain/tavily";
import { getActiveSubscriptions } from "../tools/subscription-tools";

export interface SubscriptionAdvisorState {
  userId: string;
  workspaceId: string | undefined;
  subscriptions: any[];
  researchResults: { service: string; data: string }[];
  finalReport: string | null;
}

const subscriptionStateChannels = {
  userId: { value: (x: string, y: string) => y ?? x, default: () => "" },
  workspaceId: { value: (x: string | undefined, y: string | undefined) => y ?? x, default: () => undefined },
  subscriptions: { value: (x: any[], y: any[]) => y ?? x, default: () => [] },
  researchResults: { value: (x: any[], y: any[]) => y ?? x, default: () => [] },
  finalReport: { value: (x: string | null, y: string | null) => y ?? x, default: () => null },
};

export function createSubscriptionAdvisorGraph() {
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) throw new Error("GROQ_API_KEY is missing");

  const model = new ChatGroq({
    apiKey: groqApiKey,
    model: "llama-3.3-70b-versatile",
    temperature: 0.2,
  });

  const fetchNode = async (state: SubscriptionAdvisorState) => {
    const subs = await getActiveSubscriptions(state.userId, state.workspaceId);
    if (subs.length === 0) {
      return { finalReport: "✅ You don't have any active recurring subscriptions. Great job keeping your fixed costs low!" };
    }
    return { subscriptions: subs };
  };

  const researchNode = async (state: SubscriptionAdvisorState) => {
    if (state.finalReport || state.subscriptions.length === 0) return {};

    const tool = new TavilySearch({
      maxResults: 2,
    });

    const researchResults = [];

    // Only research the top 3 most expensive subscriptions to save API calls
    const topSubs = state.subscriptions.slice(0, 3);

    for (const sub of topSubs) {
      const query = `Current price and best promotions or cheaper alternatives for ${sub.description} subscription`;
      try {
        const result = await tool.invoke({ query });
        researchResults.push({ service: sub.description, data: result });
      } catch (e) {
        console.error(`Tavily search failed for ${sub.description}`, e);
      }
    }

    return { researchResults };
  };

  const analyzeNode = async (state: SubscriptionAdvisorState) => {
    if (state.finalReport || state.researchResults.length === 0) return {};

    const prompt = new SystemMessage(`You are a savage, money-saving financial advisor.
Review the user's top subscriptions and the web research data about current deals and alternatives.
For each subscription, calculate the potential annual savings if they switch or negotiate.
Draft a brief phone script or cancellation email they can use to get a better deal (e.g. asking for retention offers).

User Subscriptions:
${JSON.stringify(state.subscriptions.slice(0, 3).map(s => ({ service: s.description, amount: s.amount, interval: s.interval })))}

Web Research Data:
${JSON.stringify(state.researchResults)}

Format your output beautifully using Markdown with emojis. Make it highly actionable.`);

    const res = await model.invoke([prompt]);
    return { finalReport: res.content as string };
  };

  const workflow = new StateGraph<SubscriptionAdvisorState>({ channels: subscriptionStateChannels })
    .addNode("fetch", fetchNode)
    .addNode("research", researchNode)
    .addNode("analyze", analyzeNode)
    .addEdge("__start__", "fetch")
    .addEdge("fetch", "research")
    .addEdge("research", "analyze")
    .addEdge("analyze", "__end__");

  return workflow.compile();
}
