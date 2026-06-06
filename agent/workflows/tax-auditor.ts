import { StateGraph } from "@langchain/langgraph";
import { ChatGroq } from "@langchain/groq";
import { SystemMessage, HumanMessage, AIMessage, BaseMessage } from "@langchain/core/messages";
import { getAnnualTransactions, generateTaxPDF } from "../tools/tax-tools";

// The state of the Tax Auditor workflow
export interface TaxAuditorState {
  userId: string;
  workspaceId: string | undefined;
  year: number;
  transactions: any[];
  currentIndex: number;
  classifications: { id: string; date: string; amount: number; description: string; category: string; type: "business" | "personal" }[];
  awaitingUserInput: boolean;
  questionToUser: string | null;
  reportUrl: string | null;
  messages: BaseMessage[];
}

const taxStateChannels = {
  userId: { value: (x: string, y: string) => y ?? x, default: () => "" },
  workspaceId: { value: (x: string | undefined, y: string | undefined) => y ?? x, default: () => undefined },
  year: { value: (x: number, y: number) => y ?? x, default: () => new Date().getFullYear() },
  transactions: { value: (x: any[], y: any[]) => y ?? x, default: () => [] },
  currentIndex: { value: (x: number, y: number) => y ?? x, default: () => 0 },
  classifications: { value: (x: any[], y: any[]) => y ?? x, default: () => [] },
  awaitingUserInput: { value: (x: boolean, y: boolean) => y ?? x, default: () => false },
  questionToUser: { value: (x: string | null, y: string | null) => y ?? x, default: () => null },
  reportUrl: { value: (x: string | null, y: string | null) => y ?? x, default: () => null },
  messages: { value: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y), default: () => [] },
};

/**
 * Creates and returns the Tax Auditor StateGraph application.
 */
export function createTaxAuditorGraph() {
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) throw new Error("GROQ_API_KEY is missing");

  const model = new ChatGroq({
    apiKey: groqApiKey,
    model: "llama-3.3-70b-versatile",
    temperature: 0.1,
  });

  // Node 1: Fetch transactions if not already fetched
  const fetchTransactionsNode = async (state: TaxAuditorState) => {
    if (state.transactions && state.transactions.length > 0) {
      return {}; // Already fetched
    }
    const txs = await getAnnualTransactions(state.userId, state.workspaceId, state.year);
    return { transactions: txs, currentIndex: 0, classifications: [] };
  };

  // Node 2: Classify the current batch of transactions
  const classifyNode = async (state: TaxAuditorState) => {
    const { transactions, currentIndex, messages } = state;
    
    // If the user just replied to an ambiguous transaction, process their reply
    if (state.awaitingUserInput && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg instanceof HumanMessage) {
        const tx = transactions[currentIndex];
        
        // Use AI to determine if the user said it was business or personal
        const evalPrompt = new SystemMessage(`The user was asked about this transaction: ${tx.description} ($${tx.amount} on ${tx.date}).
User replied: "${lastMsg.content}".
Determine if this should be classified as "business" or "personal".
Output ONLY the exact word "business" or "personal".`);
        
        const evalRes = await model.invoke([evalPrompt]);
        const decision = (evalRes.content as string).toLowerCase().includes("business") ? "business" : "personal";
        
        const classification = {
          id: tx.id,
          date: tx.date.toISOString().split("T")[0],
          amount: tx.amount,
          description: tx.description,
          category: tx.category,
          type: decision as "business" | "personal",
        };

        return {
          classifications: [...state.classifications, classification],
          currentIndex: currentIndex + 1,
          awaitingUserInput: false,
          questionToUser: null,
        };
      }
    }

    // Otherwise, classify the next transaction
    const tx = transactions[currentIndex];
    
    const prompt = new SystemMessage(`You are a Tax Auditor AI. Classify the following transaction as 'business', 'personal', or 'ambiguous'.
If it is clearly a personal expense (e.g. Netflix, Groceries, Rent, Gaming), output 'personal'.
If it is clearly a business expense (e.g. AWS, Figma, Upwork, Facebook Ads), output 'business'.
If it could be either (e.g. a Macbook, expensive dinner, travel, phone bill), output 'ambiguous'.

Transaction Details:
Category: ${tx.category}
Amount: $${tx.amount}
Description: ${tx.description}

Output your response in valid JSON format ONLY:
{
  "type": "business" | "personal" | "ambiguous",
  "reason": "short explanation",
  "question": "If ambiguous, what clarifying question should we ask the user via chat to determine if this was for business?"
}`);

    const res = await model.invoke([prompt]);
    const responseText = res.content as string;
    
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        if (parsed.type === "ambiguous") {
          return {
            awaitingUserInput: true,
            questionToUser: parsed.question || `Was the $${tx.amount} for ${tx.description} a business or personal expense?`,
          };
        } else {
          const classification = {
            id: tx.id,
            date: tx.date.toISOString().split("T")[0],
            amount: tx.amount,
            description: tx.description,
            category: tx.category,
            type: parsed.type as "business" | "personal",
          };
          return {
            classifications: [...state.classifications, classification],
            currentIndex: currentIndex + 1,
          };
        }
      }
    } catch (e) {
      console.error("Failed to parse classification JSON", e);
    }
    
    // Fallback to personal if parsing fails
    const classification = {
      id: tx.id,
      date: tx.date.toISOString().split("T")[0],
      amount: tx.amount,
      description: tx.description,
      category: tx.category,
      type: "personal" as const,
    };
    return {
      classifications: [...state.classifications, classification],
      currentIndex: currentIndex + 1,
    };
  };

  // Node 3: Generate the PDF report
  const generateReportNode = async (state: TaxAuditorState) => {
    if (state.classifications.length === 0) {
      return { reportUrl: null };
    }
    const reportUrl = await generateTaxPDF(state.year, state.classifications);
    return { reportUrl };
  };

  // Routing functions
  const shouldClassifyNext = (state: TaxAuditorState) => {
    if (state.transactions.length === 0) return "generate_report";
    if (state.awaitingUserInput) return "__end__";
    if (state.currentIndex >= state.transactions.length) return "generate_report";
    return "classify_transaction";
  };

  const workflow = new StateGraph<TaxAuditorState>({ channels: taxStateChannels })
    .addNode("fetch_transactions", fetchTransactionsNode)
    .addNode("classify_transaction", classifyNode)
    .addNode("generate_report", generateReportNode)
    .addEdge("__start__", "fetch_transactions")
    .addEdge("fetch_transactions", "classify_transaction")
    .addConditionalEdges("classify_transaction", shouldClassifyNext)
    .addEdge("generate_report", "__end__");

  return workflow.compile();
}
