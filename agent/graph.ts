import { StateGraph } from "@langchain/langgraph";
import { ChatGroq } from "@langchain/groq";
import { BaseMessage, AIMessage, ToolMessage, SystemMessage } from "@langchain/core/messages";
import { createTools } from "./tools";

// Define the state interface
export interface AgentState {
  messages: BaseMessage[];
  personaPrompt: string;
  currency: string;
}

/**
 * Executes the LangGraph agent for a user message.
 */
export async function runAgentGraph(
  userId: string,
  workspaceId: string | undefined,
  chatHistory: BaseMessage[],
  personaPrompt: string,
  currency: string
): Promise<string> {
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    throw new Error("GROQ_API_KEY is not defined");
  }

  // 1. Initialize tools and model
  const tools = createTools(userId, workspaceId);
  const model = new ChatGroq({
    apiKey: groqApiKey,
    model: "llama-3.3-70b-versatile",
    temperature: 0.5,
  });

  const modelWithTools = model.bindTools(tools);

  // 2. Define graph state channels
  const agentStateChannels = {
    messages: {
      value: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
      default: () => [],
    },
    personaPrompt: {
      value: (x: string, y: string) => y || x,
      default: () => "",
    },
    currency: {
      value: (x: string, y: string) => y || x,
      default: () => "USD",
    },
  };

  // 3. Define node functions
  const callModelNode = async (state: AgentState) => {
    const systemMessage = new SystemMessage({
      content: `You are Budget Buddy, an expert financial analyst with a unique personality adapted to the user.
${state.personaPrompt}

Use the provided tools to answer user questions on demand instead of listing all transactions.
Format all monetary amounts in the user's currency (${state.currency}).
Be concise and helpful, since you are chatting on Telegram/Discord/Slack. Use platform-friendly Markdown (like **bold**, *italics*, bullet points, emojis).
DO NOT use custom React tags like [BAR_CHART: ...]. If the user asks for a chart or summary, provide a beautiful text-based summary using bullet points or emojis.`
    });

    const response = await modelWithTools.invoke([systemMessage, ...state.messages]);
    return { messages: [response] };
  };

  const callToolsNode = async (state: AgentState) => {
    const lastMessage = state.messages[state.messages.length - 1] as AIMessage;
    const toolCalls = lastMessage.tool_calls || [];
    const results = [];

    for (const call of toolCalls) {
      const tool = tools.find((t) => t.name === call.name);
      if (!tool) {
        results.push(new ToolMessage({
          content: `Error: Tool ${call.name} not found.`,
          tool_call_id: call.id ?? "",
        }));
      } else {
        try {
          const output = await (tool as any).invoke(call.args);
          results.push(new ToolMessage({
            content: typeof output === "string" ? output : JSON.stringify(output),
            tool_call_id: call.id ?? "",
          }));
        } catch (err: any) {
          results.push(new ToolMessage({
            content: `Error running tool ${call.name}: ${err.message}`,
            tool_call_id: call.id ?? "",
          }));
        }
      }
    }
    return { messages: results };
  };

  // 4. Define routing function
  const shouldContinue = (state: AgentState) => {
    const lastMessage = state.messages[state.messages.length - 1] as AIMessage;
    if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
      return "tools";
    }
    return "__end__";
  };

  // 5. Build workflow graph
  const workflow = new StateGraph<AgentState>({
    channels: agentStateChannels,
  })
    .addNode("agent", callModelNode)
    .addNode("tools", callToolsNode)
    .addEdge("__start__", "agent")
    .addConditionalEdges("agent", shouldContinue)
    .addEdge("tools", "agent");

  // Compile graph
  const app = workflow.compile();

  // Run the graph
  const finalState = await app.invoke({
    messages: chatHistory,
    personaPrompt,
    currency,
  });

  const lastMsg = (finalState as any).messages[(finalState as any).messages.length - 1];
  return lastMsg.content as string;
}
