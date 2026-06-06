import { StateGraph } from "@langchain/langgraph";
import { ChatGroq } from "@langchain/groq";
import { SystemMessage } from "@langchain/core/messages";
import { getSplitwiseFriends, SplitwiseFriend } from "../tools/splitwise-tools";

export interface DebtNegotiatorState {
  userId: string;
  friends: SplitwiseFriend[];
  overdueDebtors: SplitwiseFriend[];
  draftedReminders: { friendId: number; name: string; amount: number; message: string }[];
  finalReport: string | null;
}

const debtStateChannels = {
  userId: { value: (x: string, y: string) => y ?? x, default: () => "" },
  friends: { value: (x: SplitwiseFriend[], y: SplitwiseFriend[]) => y ?? x, default: () => [] },
  overdueDebtors: { value: (x: SplitwiseFriend[], y: SplitwiseFriend[]) => y ?? x, default: () => [] },
  draftedReminders: { value: (x: any[], y: any[]) => y ?? x, default: () => [] },
  finalReport: { value: (x: string | null, y: string | null) => y ?? x, default: () => null },
};

export function createDebtNegotiatorGraph() {
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) throw new Error("GROQ_API_KEY is missing");

  const model = new ChatGroq({
    apiKey: groqApiKey,
    model: "llama-3.3-70b-versatile",
    temperature: 0.4,
  });

  const fetchNode = async (state: DebtNegotiatorState) => {
    try {
      const friends = await getSplitwiseFriends(state.userId);
      return { friends };
    } catch (e: any) {
      return { finalReport: `❌ ${e.message}` };
    }
  };

  const identifyNode = async (state: DebtNegotiatorState) => {
    if (state.finalReport) return {};
    
    // Anyone who owes the user more than $5 is considered "overdue" for this demonstration
    const overdueDebtors = state.friends.filter(f => f.balance > 5);
    
    if (overdueDebtors.length === 0) {
      return { finalReport: "✅ You have no outstanding debts! Everyone is settled up." };
    }
    
    return { overdueDebtors };
  };

  const draftNode = async (state: DebtNegotiatorState) => {
    if (state.finalReport || state.overdueDebtors.length === 0) return {};

    const draftedReminders = [];
    
    for (const debtor of state.overdueDebtors) {
      const prompt = new SystemMessage(`You are a polite but firm debt negotiation assistant.
The user's friend ${debtor.first_name} ${debtor.last_name || ""} owes them $${debtor.balance.toFixed(2)} on Splitwise.
Draft a short, friendly, and casual text message that the user can copy-paste and send via WhatsApp/Telegram to remind their friend to pay them back.
Keep it under 3 sentences. Include emojis.

Output ONLY the text message.`);

      const res = await model.invoke([prompt]);
      
      draftedReminders.push({
        friendId: debtor.id,
        name: debtor.first_name,
        amount: debtor.balance,
        message: res.content as string,
      });
    }

    return { draftedReminders };
  };

  const reportNode = async (state: DebtNegotiatorState) => {
    if (state.finalReport) return {};

    let report = `💰 **Debt Negotiator**\nI found ${state.draftedReminders.length} friends who owe you money.\n\n`;
    
    state.draftedReminders.forEach(draft => {
      report += `**${draft.name}** owes you **$${draft.amount.toFixed(2)}**\n`;
      report += `📝 *Suggested Text:*\n\`${draft.message}\`\n\n`;
    });
    
    report += "You can easily copy and paste these into WhatsApp or Telegram!";
    
    return { finalReport: report };
  };

  const workflow = new StateGraph<DebtNegotiatorState>({ channels: debtStateChannels })
    .addNode("fetch", fetchNode)
    .addNode("identify", identifyNode)
    .addNode("draft", draftNode)
    .addNode("report", reportNode)
    .addEdge("__start__", "fetch")
    .addEdge("fetch", "identify")
    .addEdge("identify", "draft")
    .addEdge("draft", "report")
    .addEdge("report", "__end__");

  return workflow.compile();
}
