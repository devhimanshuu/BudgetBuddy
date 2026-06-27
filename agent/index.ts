import { HumanMessage, AIMessage, BaseMessage } from "@langchain/core/messages";
import { getPersona } from "@/lib/persona";
import { getActiveWorkspace } from "@/lib/workspaces";
import prisma from "@/lib/prisma";
import { runAgentGraph } from "./graph";

export async function runAgent(
  userId: string,
  message: string,
  history: { role: "user" | "assistant"; content: string }[] = [],
  workspaceId?: string
): Promise<string> {
  // 1. Fetch User Context
  let wsId = workspaceId;
  if (!wsId) {
    try {
      const workspace = await getActiveWorkspace(userId);
      wsId = workspace?.id;
    } catch {
      // getActiveWorkspace may fail in webhook contexts (no cookies)
      const membership = await prisma.workspaceMember.findFirst({
        where: { userId, deletedAt: null },
      });
      wsId = membership?.workspaceId;
    }
  }
  const [personaData, userSettings] = await Promise.all([
    getPersona(userId, wsId),
    prisma.userSettings.findUnique({ where: { userId } }),
  ]);

  const personaPrompt = personaData.aiPrompt;
  const currency = userSettings?.currency || "USD";

  // 2. Convert History to LangChain format
  const lcHistory: BaseMessage[] = history.map((msg) => {
    if (msg.role === "user") {
      return new HumanMessage(msg.content);
    } else {
      return new AIMessage(msg.content);
    }
  });

  // Append current user message
  lcHistory.push(new HumanMessage(message));

  // 3. Run the LangGraph Agent
  try {
    const response = await runAgentGraph(
      userId,
      wsId,
      lcHistory,
      personaPrompt,
      currency
    );
    return response;
  } catch (error: any) {
    console.error("Agent Error:", error);
    const msg = String(error?.message || "");
    if (msg.includes("429") || msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("rate_limit")) {
      return "⏳ I've hit my AI usage limit for now (all providers are busy or rate-limited). Please try again in a little while.";
    }
    return `❌ Sorry, I encountered an error while processing your request: ${error.message}`;
  }
}
