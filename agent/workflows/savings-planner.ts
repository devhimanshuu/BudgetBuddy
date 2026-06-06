import { StateGraph } from "@langchain/langgraph";
import { ChatGroq } from "@langchain/groq";
import { SystemMessage } from "@langchain/core/messages";
import { TavilySearch } from "@langchain/tavily";
import prisma from "@/lib/prisma";

export interface SavingsPlannerState {
  userId: string;
  workspaceId?: string;
  userMessage: string;
  
  parsedGoal?: {
    goalName: string;
    destination: string;
    durationDays: number;
    targetDate: string; // YYYY-MM-DD
  };

  researchData?: string;
  
  calculatedPlan?: {
    totalCost: number;
    monthlySavings: number;
    breakdown: string;
  };

  finalMessage?: string;
}

const plannerStateChannels = {
  userId: { value: (x: string, y: string) => y ?? x, default: () => "" },
  workspaceId: { value: (x: any, y: any) => y ?? x, default: () => undefined },
  userMessage: { value: (x: string, y: string) => y ?? x, default: () => "" },
  parsedGoal: { value: (x: any, y: any) => y ?? x, default: () => undefined },
  researchData: { value: (x: any, y: any) => y ?? x, default: () => undefined },
  calculatedPlan: { value: (x: any, y: any) => y ?? x, default: () => undefined },
  finalMessage: { value: (x: any, y: any) => y ?? x, default: () => undefined },
};

export function createSavingsPlannerGraph() {
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) throw new Error("GROQ_API_KEY is missing");

  const model = new ChatGroq({
    apiKey: groqApiKey,
    model: "llama-3.3-70b-versatile",
    temperature: 0.2,
  });

  const parseGoalNode = async (state: SavingsPlannerState): Promise<any> => {
    const prompt = new SystemMessage(`Extract the savings goal details from the user's message.
Message: "${state.userMessage}"

Today's date is ${new Date().toISOString().split("T")[0]}.
If the user doesn't specify a target date, default to exactly 1 year from today.
If they don't specify duration, default to 7 days.
Output ONLY valid JSON:
{
  "goalName": "short descriptive name",
  "destination": "where are they going or what are they buying",
  "durationDays": number,
  "targetDate": "YYYY-MM-DD"
}`);

    const res = await model.invoke([prompt]);
    const jsonMatch = (res.content as string).match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Failed to parse goal");
    
    return { parsedGoal: JSON.parse(jsonMatch[0]) };
  };

  const researchNode = async (state: SavingsPlannerState): Promise<any> => {
    if (!state.parsedGoal) return {};
    
    const tool = new TavilySearch({
      maxResults: 3,
    });
    
    const query = `Average cost of a ${state.parsedGoal.durationDays}-day trip to ${state.parsedGoal.destination} including flights, hotel, and food`;
    const searchResults = await tool.invoke({ query });
    
    return { researchData: searchResults };
  };

  const calculateNode = async (state: SavingsPlannerState): Promise<any> => {
    if (!state.parsedGoal || !state.researchData) return {};

    const prompt = new SystemMessage(`You are a financial planner.
User wants to go to ${state.parsedGoal.destination} for ${state.parsedGoal.durationDays} days.
Target date: ${state.parsedGoal.targetDate}
Today: ${new Date().toISOString().split("T")[0]}

Here is the web research data:
${state.researchData}

Calculate a realistic total cost and the monthly savings required to reach it.
Output ONLY valid JSON:
{
  "totalCost": number,
  "monthlySavings": number,
  "breakdown": "A brief, formatted string explaining the cost breakdown (Flights, Hotel, Food, etc.)"
}`);

    const res = await model.invoke([prompt]);
    const jsonMatch = (res.content as string).match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Failed to calculate plan");
    
    return { calculatedPlan: JSON.parse(jsonMatch[0]) };
  };

  const createGoalNode = async (state: SavingsPlannerState): Promise<any> => {
    if (!state.parsedGoal || !state.calculatedPlan) return {};

    const goal = await prisma.savingsGoal.create({
      data: {
        userId: state.userId,
        workspaceId: state.workspaceId || null,
        name: state.parsedGoal.goalName,
        description: state.calculatedPlan.breakdown,
        targetAmount: state.calculatedPlan.totalCost,
        currentAmount: 0,
        targetDate: new Date(state.parsedGoal.targetDate),
        category: "Travel",
        icon: "✈️",
        color: "#3b82f6",
      }
    });

    const msg = `🌍 **Savings Goal Created: ${goal.name}**\n\n` +
      `Based on real-world data, your ${state.parsedGoal.durationDays}-day trip will cost approximately **$${state.calculatedPlan.totalCost}**.\n\n` +
      `📊 **Cost Breakdown:**\n${state.calculatedPlan.breakdown}\n\n` +
      `💡 **Action Plan:** To reach your goal by ${state.parsedGoal.targetDate}, you need to save **$${state.calculatedPlan.monthlySavings}/month**.\n\n` +
      `I have automatically added this to your BudgetBuddy Savings Goals!`;

    return { finalMessage: msg };
  };

  const workflow = new StateGraph<SavingsPlannerState>({ channels: plannerStateChannels })
    .addNode("parse_goal", parseGoalNode)
    .addNode("research_costs", researchNode)
    .addNode("calculate_plan", calculateNode)
    .addNode("create_goal", createGoalNode)
    .addEdge("__start__", "parse_goal")
    .addEdge("parse_goal", "research_costs")
    .addEdge("research_costs", "calculate_plan")
    .addEdge("calculate_plan", "create_goal")
    .addEdge("create_goal", "__end__");

  return workflow.compile();
}
