import { HumanMessage, AIMessage, BaseMessage } from "@langchain/core/messages";
import { getPersona } from "@/lib/persona";
import { getActiveWorkspace } from "@/lib/workspaces";
import prisma from "@/lib/prisma";
import { runAgentGraph } from "./graph";

export async function runAgent(
  userId: string,
  message: string,
  history: { role: "user" | "assistant"; content: string }[] = []
): Promise<string> {
  // 1. Fetch User Context
  const workspace = await getActiveWorkspace(userId);
  const [personaData, userSettings] = await Promise.all([
    getPersona(userId, workspace?.id),
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
      workspace?.id,
      lcHistory,
      personaPrompt,
      currency
    );
    return response;
  } catch (error: any) {
    console.error("Agent Error:", error);
    return `❌ Sorry, I encountered an error while processing your request: ${error.message}`;
  }
}
