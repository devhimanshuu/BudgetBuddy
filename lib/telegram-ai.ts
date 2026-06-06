import { runAgent } from "@/agent";

export async function ChatWithAIHeadless(
  userId: string,
  message: string,
  history: { role: "user" | "assistant"; content: string }[] = []
): Promise<string> {
  return runAgent(userId, message, history);
}
