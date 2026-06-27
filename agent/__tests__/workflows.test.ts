import { describe, it, expect, vi, beforeEach } from "vitest";
import { HumanMessage } from "@langchain/core/messages";
import type { TaxAuditorState } from "@/agent/workflows/tax-auditor";
import { getAnnualTransactions } from "@/agent/tools/tax-tools";
import { ExtractReceiptData } from "@/app/(dashboard)/_actions/extractReceipt";

// ── Mocks ────────────────────────────────────────────────────────────────────

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  default: {
    transaction: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    budget: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    userSettings: {
      findUnique: vi.fn().mockResolvedValue({ userId: "user-1", splitwiseToken: null }),
      update: vi.fn(),
    },
    category: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "cat-1", name: "Food", icon: "🧾", color: "#3b82f6", type: "expense" }),
      upsert: vi.fn().mockResolvedValue({ id: "cat-1", name: "Test", icon: "🏷️" }),
    },
    $transaction: vi.fn((fn: any) => fn({
      transaction: { create: vi.fn().mockResolvedValue({ id: "tx-1", type: "expense", category: "Food", amount: 50, date: new Date() }) },
      monthlyHistory: { upsert: vi.fn() },
      yearHistory: { upsert: vi.fn() },
      goalContribution: { create: vi.fn() },
      savingsGoal: { update: vi.fn() },
    })),
  },
}));

// Mock the shared model factory so workflows get a fake, invokable model.
// (createChatModel/createToolModel wrap Groq with an OpenRouter fallback; we
// bypass all of that here and just return an object exposing `invoke`.)
const mockInvoke = vi.fn();
vi.mock("@/agent/model", () => {
  const fakeModel = {
    invoke: mockInvoke,
    bindTools() { return this; },
    withFallbacks() { return this; },
  };
  return {
    createChatModel: () => fakeModel,
    createToolModel: () => fakeModel,
  };
});

// Mock Tavily
vi.mock("@langchain/tavily", () => ({
  TavilySearch: vi.fn().mockImplementation(() => ({
    invoke: vi.fn().mockResolvedValue("Mock search results"),
  })),
}));

// Mock tax tools
vi.mock("@/agent/tools/tax-tools", () => ({
  getAnnualTransactions: vi.fn().mockResolvedValue([] as any[]),
  generateTaxPDF: vi.fn().mockResolvedValue("/reports/test.pdf"),
}));

// Mock receipt extraction
vi.mock("@/app/(dashboard)/_actions/extractReceipt", () => ({
  ExtractReceiptData: vi.fn().mockResolvedValue({
    success: true,
    data: { merchant: "Test Store", amount: 25.50, category: "Food", items: ["Burger", "Fries"] },
  }),
}));

// Mock splitwise tools
vi.mock("@/agent/tools/splitwise-tools", () => ({
  getSplitwiseFriends: vi.fn().mockResolvedValue([]),
}));

// Mock subscription tools
vi.mock("@/agent/tools/subscription-tools", () => ({
  getActiveSubscriptions: vi.fn().mockResolvedValue([]),
}));

// Set env vars
beforeEach(() => {
  process.env.GROQ_API_KEY = "test-key";
  process.env.TAVILY_API_KEY = "test-tavily-key";
  vi.clearAllMocks();
  mockInvoke.mockReset();
});

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Simulate what happens when state is serialized to JSON and deserialized back
 *  (i.e., LangChain message class instances become plain objects) */
function serializeAndDeserialize(state: any): any {
  return JSON.parse(JSON.stringify(state));
}

/** Create a plain object that looks like a deserialized HumanMessage */
function plainHumanMessage(content: string) {
  return { _type: "human", content, type: "human", role: "user" };
}

/** Create a plain object that looks like a deserialized AIMessage */
function plainAIMessage(content: string) {
  return { _type: "ai", content, type: "ai", role: "assistant" };
}

// ═════════════════════════════════════════════════════════════════════════════
// TAX AUDITOR
// ═════════════════════════════════════════════════════════════════════════════

describe("Tax Auditor Workflow", () => {
  it("should create graph without errors", async () => {
    const { createTaxAuditorGraph } = await import("@/agent/workflows/tax-auditor");
    const graph = createTaxAuditorGraph();
    expect(graph).toBeDefined();
  });

  it("should classify transactions and generate report", async () => {
    vi.mocked(getAnnualTransactions).mockResolvedValue([
      { id: "tx-1", date: new Date("2026-01-15T00:00:00.000Z"), amount: 150, description: "AWS Hosting", category: "Software" } as any,
      { id: "tx-2", date: new Date("2026-01-20T00:00:00.000Z"), amount: 12, description: "Netflix", category: "Entertainment" } as any,
    ]);

    mockInvoke
      .mockResolvedValueOnce({ content: JSON.stringify({ type: "business", reason: "Cloud hosting" }) })
      .mockResolvedValueOnce({ content: JSON.stringify({ type: "personal", reason: "Streaming" }) });

    const { createTaxAuditorGraph } = await import("@/agent/workflows/tax-auditor");
    const graph = createTaxAuditorGraph();

    const result: any = await graph.invoke({
      userId: "user-1",
      workspaceId: "ws-1",
      year: 2026,
      transactions: [],
      currentIndex: 0,
      classifications: [],
      awaitingUserInput: false,
      questionToUser: null,
      reportUrl: null,
      messages: [],
    });

    expect(result.classifications).toHaveLength(2);
    expect(result.classifications[0].type).toBe("business");
    expect(result.classifications[1].type).toBe("personal");
    expect(result.reportUrl).toBe("/reports/test.pdf");
  });

  it("should handle deserialized state with plain object messages (not instanceof HumanMessage)", async () => {
    vi.mocked(getAnnualTransactions).mockResolvedValue([
      { id: "tx-1", date: new Date("2026-01-15T00:00:00.000Z"), amount: 150, description: "AWS Hosting", category: "Software" } as any,
    ]);

    // Classify as ambiguous → asks user
    mockInvoke.mockResolvedValueOnce({
      content: JSON.stringify({ type: "ambiguous", reason: "Could be either", question: "Was this for business?" }),
    });

    const { createTaxAuditorGraph } = await import("@/agent/workflows/tax-auditor");
    const graph = createTaxAuditorGraph();

    const pausedState = await graph.invoke({
      userId: "user-1",
      workspaceId: "ws-1",
      year: 2026,
      transactions: [],
      currentIndex: 0,
      classifications: [],
      awaitingUserInput: false,
      questionToUser: null,
      reportUrl: null,
      messages: [],
    });

    expect(pausedState.awaitingUserInput).toBe(true);

    // Simulate DB serialization: serialize state to JSON, deserialize back
    const deserialized = serializeAndDeserialize(pausedState);

    // Add a user reply as a PLAIN OBJECT (what happens after DB round-trip)
    deserialized.messages.push(plainHumanMessage("Yes, this was for my business"));

    // Mock the eval response
    mockInvoke.mockResolvedValueOnce({ content: "business" });

    // The graph should handle the plain object message correctly
    const finalState: any = await graph.invoke(deserialized);

    expect(finalState.classifications.length).toBeGreaterThanOrEqual(1);
  });

  it("should handle awaitingUserInput with unparseable message by defaulting to personal", async () => {
    vi.mocked(getAnnualTransactions).mockResolvedValue([
      { id: "tx-1", date: new Date("2026-01-15T00:00:00.000Z"), amount: 150, description: "AWS Hosting", category: "Software" } as any,
    ]);

    // Classify as ambiguous
    mockInvoke.mockResolvedValueOnce({
      content: JSON.stringify({ type: "ambiguous", reason: "Unclear", question: "Business or personal?" }),
    });

    const { createTaxAuditorGraph } = await import("@/agent/workflows/tax-auditor");
    const graph = createTaxAuditorGraph();

    const pausedState = await graph.invoke({
      userId: "user-1",
      workspaceId: "ws-1",
      year: 2026,
      transactions: [],
      currentIndex: 0,
      classifications: [],
      awaitingUserInput: false,
      questionToUser: null,
      reportUrl: null,
      messages: [],
    });

    expect(pausedState.awaitingUserInput).toBe(true);

    // Simulate deserialized state with an unrecognized message type
    const deserialized = serializeAndDeserialize(pausedState);
    deserialized.messages.push(plainAIMessage("some response"));

    const finalState: any = await graph.invoke(deserialized);

    // Should default to personal and continue (not hang)
    expect(finalState.awaitingUserInput).toBe(false);
    expect(finalState.classifications.length).toBeGreaterThanOrEqual(1);
    expect(finalState.classifications[0].type).toBe("personal");
  });

  it("should handle empty transactions gracefully", async () => {
    vi.mocked(getAnnualTransactions).mockResolvedValue([]);

    const { createTaxAuditorGraph } = await import("@/agent/workflows/tax-auditor");
    const graph = createTaxAuditorGraph();

    const result = await graph.invoke({
      userId: "user-1",
      workspaceId: "ws-1",
      year: 2026,
      transactions: [],
      currentIndex: 0,
      classifications: [],
      awaitingUserInput: false,
      questionToUser: null,
      reportUrl: null,
      messages: [],
    });

    expect(result.classifications).toHaveLength(0);
    expect(result.reportUrl).toBeNull();
  });

  it("should route to generate_report when all transactions are classified", async () => {
    vi.mocked(getAnnualTransactions).mockResolvedValue([
      { id: "tx-1", date: new Date("2026-01-15T00:00:00.000Z"), amount: 50, description: "Lunch", category: "Food" } as any,
    ]);

    mockInvoke.mockResolvedValueOnce({
      content: JSON.stringify({ type: "personal", reason: "Food" }),
    });

    const { createTaxAuditorGraph } = await import("@/agent/workflows/tax-auditor");
    const graph = createTaxAuditorGraph();

    const result = await graph.invoke({
      userId: "user-1",
      workspaceId: "ws-1",
      year: 2026,
      transactions: [],
      currentIndex: 0,
      classifications: [],
      awaitingUserInput: false,
      questionToUser: null,
      reportUrl: null,
      messages: [],
    });

    // Should have classified and generated report
    expect(result.classifications).toHaveLength(1);
    expect(result.currentIndex).toBeGreaterThanOrEqual(1);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// RECEIPT SCANNER
// ═════════════════════════════════════════════════════════════════════════════

describe("Receipt Scanner Workflow", () => {
  it("should create graph without errors", async () => {
    const { createReceiptScannerGraph } = await import("@/agent/workflows/receipt-scanner");
    const graph = createReceiptScannerGraph();
    expect(graph).toBeDefined();
  });

  it("should scan receipt and record transaction", async () => {
    const { createReceiptScannerGraph } = await import("@/agent/workflows/receipt-scanner");
    const graph = createReceiptScannerGraph();

    // Mock: not a group meal
    mockInvoke.mockResolvedValueOnce({ content: "no" });

    const result = await graph.invoke({
      userId: "user-1",
      workspaceId: "ws-1",
      imageBase64: "data:image/jpeg;base64,abc123",
      isGroupMeal: false,
      awaitingUserInput: false,
      messages: [],
    });

    expect(result.finalMessage).toContain("Recorded");
    expect(result.finalMessage).toContain("25.5");
    expect(result.finalMessage).toContain("Food");
    expect(result.finalMessage).toContain("Test Store");
  });

  it("should handle deserialized state with plain object messages for split reply", async () => {
    const { createReceiptScannerGraph } = await import("@/agent/workflows/receipt-scanner");
    const graph = createReceiptScannerGraph();

    // First: detect group meal
    mockInvoke.mockResolvedValueOnce({ content: "yes" });

    const pausedState = await graph.invoke({
      userId: "user-1",
      workspaceId: "ws-1",
      imageBase64: "data:image/jpeg;base64,abc123",
      isGroupMeal: false,
      awaitingUserInput: false,
      messages: [],
    });

    expect(pausedState.awaitingUserInput).toBe(true);
    expect(pausedState.questionToUser).toContain("split");

    // Simulate DB serialization
    const deserialized = serializeAndDeserialize(pausedState);

    // Add user reply as plain object
    deserialized.messages.push(plainHumanMessage("Alice and Bob"));

    // Mock: extract names
    mockInvoke.mockResolvedValueOnce({ content: '["Alice", "Bob"]' });

    const finalState = await graph.invoke(deserialized);

    expect(finalState.isGroupMeal).toBe(true);
    expect(finalState.friendsToSplitWith).toEqual(["Alice", "Bob"]);
    expect(finalState.finalMessage).toContain("Alice");
    expect(finalState.finalMessage).toContain("Bob");
    // Verify split math: $25.50 / 3 people = $8.50 each
    expect(finalState.finalMessage).toContain("8.50");
  });

  it("should handle 'no' reply to split question", async () => {
    const { createReceiptScannerGraph } = await import("@/agent/workflows/receipt-scanner");
    const graph = createReceiptScannerGraph();

    mockInvoke.mockResolvedValueOnce({ content: "yes" });

    const pausedState = await graph.invoke({
      userId: "user-1",
      workspaceId: "ws-1",
      imageBase64: "data:image/jpeg;base64,abc123",
      isGroupMeal: false,
      awaitingUserInput: false,
      messages: [],
    });

    const deserialized = serializeAndDeserialize(pausedState);
    deserialized.messages.push(plainHumanMessage("no"));

    const finalState = await graph.invoke(deserialized);

    expect(finalState.isGroupMeal).toBe(false);
    expect(finalState.finalMessage).toContain("Recorded");
  });

  it("should handle deserialized state with unparseable message (fallback to no split)", async () => {
    const { createReceiptScannerGraph } = await import("@/agent/workflows/receipt-scanner");
    const graph = createReceiptScannerGraph();

    mockInvoke.mockResolvedValueOnce({ content: "yes" });

    const pausedState = await graph.invoke({
      userId: "user-1",
      workspaceId: "ws-1",
      imageBase64: "data:image/jpeg;base64,abc123",
      isGroupMeal: false,
      awaitingUserInput: false,
      messages: [],
    });

    const deserialized = serializeAndDeserialize(pausedState);
    deserialized.messages.push(plainAIMessage("I'm not sure"));

    const finalState = await graph.invoke(deserialized);

    expect(finalState.isGroupMeal).toBe(false);
    expect(finalState.friendsToSplitWith).toEqual([]);
    expect(finalState.finalMessage).toContain("Recorded");
  });

  it("should handle failed receipt extraction", async () => {
    vi.mocked(ExtractReceiptData).mockResolvedValueOnce({ success: false, data: undefined });

    const { createReceiptScannerGraph } = await import("@/agent/workflows/receipt-scanner");
    const graph = createReceiptScannerGraph();

    const result = await graph.invoke({
      userId: "user-1",
      workspaceId: "ws-1",
      imageBase64: "data:image/jpeg;base64,abc123",
      isGroupMeal: false,
      awaitingUserInput: false,
      messages: [],
    });

    expect(result.finalMessage).toContain("couldn't read");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// WEALTH CHALLENGER
// ═════════════════════════════════════════════════════════════════════════════

describe("Wealth Challenger Workflow", () => {
  it("should create graph without errors", async () => {
    const { createWealthChallengerGraph } = await import("@/agent/workflows/wealth-challenger");
    const graph = createWealthChallengerGraph();
    expect(graph).toBeDefined();
  });

  it("should propose a new challenge", async () => {
    mockInvoke.mockResolvedValueOnce({
      content: JSON.stringify({
        id: "no-coffee",
        targetCategory: "Coffee",
        deadlineDays: 3,
        points: 500,
        description: "Spend $0 on Coffee for 3 days",
      }),
    });

    const { createWealthChallengerGraph } = await import("@/agent/workflows/wealth-challenger");
    const graph = createWealthChallengerGraph();

    const result = await graph.invoke({
      userId: "user-1",
      workspaceId: "ws-1",
      action: "PROPOSE",
      awaitingUserInput: false,
      messages: [],
    });

    expect(result.awaitingUserInput).toBe(true);
    expect(result.proposedChallenge).toBeDefined();
    expect(result.proposedChallenge.targetCategory).toBe("Coffee");
    expect(result.questionToUser).toContain("Challenge");
  });

  it("should accept challenge with deserialized plain object message", async () => {
    const { createWealthChallengerGraph } = await import("@/agent/workflows/wealth-challenger");
    const graph = createWealthChallengerGraph();

    mockInvoke.mockResolvedValueOnce({
      content: JSON.stringify({
        id: "no-coffee",
        targetCategory: "Coffee",
        deadlineDays: 3,
        points: 500,
        description: "Spend $0 on Coffee for 3 days",
      }),
    });

    const pausedState = await graph.invoke({
      userId: "user-1",
      workspaceId: "ws-1",
      action: "PROPOSE",
      awaitingUserInput: false,
      messages: [],
    });

    expect(pausedState.awaitingUserInput).toBe(true);

    // Simulate DB serialization
    const deserialized = serializeAndDeserialize(pausedState);
    deserialized.messages.push(plainHumanMessage("Yes, I accept!"));

    const finalState = await graph.invoke(deserialized);

    expect(finalState.awaitingUserInput).toBe(false);
    expect(finalState.activeChallenge).toBeDefined();
    expect(finalState.activeChallenge.startDate).toBeDefined();
    expect(finalState.finalMessage).toContain("Challenge Accepted");
  });

  it("should decline challenge with plain object message", async () => {
    const { createWealthChallengerGraph } = await import("@/agent/workflows/wealth-challenger");
    const graph = createWealthChallengerGraph();

    mockInvoke.mockResolvedValueOnce({
      content: JSON.stringify({
        id: "no-coffee",
        targetCategory: "Coffee",
        deadlineDays: 3,
        points: 500,
        description: "Spend $0 on Coffee for 3 days",
      }),
    });

    const pausedState = await graph.invoke({
      userId: "user-1",
      workspaceId: "ws-1",
      action: "PROPOSE",
      awaitingUserInput: false,
      messages: [],
    });

    const deserialized = serializeAndDeserialize(pausedState);
    deserialized.messages.push(plainHumanMessage("No thanks"));

    const finalState = await graph.invoke(deserialized);

    expect(finalState.finalMessage).toContain("No problem");
    expect(finalState.awaitingUserInput).toBe(false);
  });

  it("should handle unparseable message during proposal (fallback to decline)", async () => {
    const { createWealthChallengerGraph } = await import("@/agent/workflows/wealth-challenger");
    const graph = createWealthChallengerGraph();

    mockInvoke.mockResolvedValueOnce({
      content: JSON.stringify({
        id: "no-coffee",
        targetCategory: "Coffee",
        deadlineDays: 3,
        points: 500,
        description: "Spend $0 on Coffee for 3 days",
      }),
    });

    const pausedState = await graph.invoke({
      userId: "user-1",
      workspaceId: "ws-1",
      action: "PROPOSE",
      awaitingUserInput: false,
      messages: [],
    });

    const deserialized = serializeAndDeserialize(pausedState);
    deserialized.messages.push(plainAIMessage("I'm confused"));

    const finalState = await graph.invoke(deserialized);

    // Should default to decline
    expect(finalState.finalMessage).toContain("No problem");
  });

  it("should handle CHECK action with no active challenge", async () => {
    const { createWealthChallengerGraph } = await import("@/agent/workflows/wealth-challenger");
    const graph = createWealthChallengerGraph();

    const result = await graph.invoke({
      userId: "user-1",
      workspaceId: "ws-1",
      action: "CHECK",
      awaitingUserInput: false,
      messages: [],
    });

    expect(result.finalMessage).toContain("don't have an active challenge");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// MONTHLY REVIEW
// ═════════════════════════════════════════════════════════════════════════════

describe("Monthly Review Workflow", () => {
  it("should create graph without errors", async () => {
    const { createMonthlyReviewGraph } = await import("@/agent/workflows/monthly-review");
    const graph = createMonthlyReviewGraph();
    expect(graph).toBeDefined();
  });

  it("should run full review pipeline (gather → accountant → coach → synthesize)", async () => {
    mockInvoke
      .mockResolvedValueOnce({ content: "The accountant says: you spent too much on coffee." })
      .mockResolvedValueOnce({ content: "The coach says: great job investing in yourself!" })
      .mockResolvedValueOnce({ content: "Final Review: Balance your spending with savings." });

    const { createMonthlyReviewGraph } = await import("@/agent/workflows/monthly-review");
    const graph = createMonthlyReviewGraph();

    const result = await graph.invoke({
      userId: "user-1",
      workspaceId: "ws-1",
      month: 6,
      year: 2026,
      financialData: "",
      accountantReport: "",
      coachReport: "",
      finalReport: "",
    });

    expect(result.financialData).toBeDefined();
    expect(result.accountantReport).toContain("accountant");
    expect(result.coachReport).toContain("coach");
    expect(result.finalReport).toContain("Final Review");
  });

  it("should handle LLM failure in accountant node with fallback", async () => {
    mockInvoke
      .mockRejectedValueOnce(new Error("Groq API timeout"))
      .mockResolvedValueOnce({ content: "The coach says: you're doing great!" })
      .mockResolvedValueOnce({ content: "Final balanced review." });

    const { createMonthlyReviewGraph } = await import("@/agent/workflows/monthly-review");
    const graph = createMonthlyReviewGraph();

    const result = await graph.invoke({
      userId: "user-1",
      workspaceId: "ws-1",
      month: 6,
      year: 2026,
      financialData: "",
      accountantReport: "",
      coachReport: "",
      finalReport: "",
    });

    expect(result.accountantReport).toContain("Unable to generate accountant report");
    expect(result.coachReport).toContain("coach");
    expect(result.finalReport).toBeDefined();
  });

  it("should handle LLM failure in synthesize node with manual fallback", async () => {
    mockInvoke
      .mockResolvedValueOnce({ content: "Accountant report text" })
      .mockResolvedValueOnce({ content: "Coach report text" })
      .mockRejectedValueOnce(new Error("Synthesis failed"));

    const { createMonthlyReviewGraph } = await import("@/agent/workflows/monthly-review");
    const graph = createMonthlyReviewGraph();

    const result = await graph.invoke({
      userId: "user-1",
      workspaceId: "ws-1",
      month: 6,
      year: 2026,
      financialData: "",
      accountantReport: "",
      coachReport: "",
      finalReport: "",
    });

    // Should use manual fallback combining both reports
    expect(result.finalReport).toContain("Accountant");
    expect(result.finalReport).toContain("Coach");
  });

  it("should preserve all state fields through serialization round-trip", async () => {
    mockInvoke
      .mockResolvedValueOnce({ content: "Accountant says cut costs" })
      .mockResolvedValueOnce({ content: "Coach says spend on experiences" })
      .mockResolvedValueOnce({ content: "Balanced final review" });

    const { createMonthlyReviewGraph } = await import("@/agent/workflows/monthly-review");
    const graph = createMonthlyReviewGraph();

    const result = await graph.invoke({
      userId: "user-1",
      workspaceId: "ws-1" as string | undefined,
      month: 6,
      year: 2026,
      financialData: "",
      accountantReport: "",
      coachReport: "",
      finalReport: "",
    });

    // Simulate serialization round-trip
    const serialized = serializeAndDeserialize(result);

    expect(serialized.userId).toBe("user-1");
    expect(serialized.month).toBe(6);
    expect(serialized.year).toBe(2026);
    expect(typeof serialized.financialData).toBe("string");
    expect(typeof serialized.accountantReport).toBe("string");
    expect(typeof serialized.coachReport).toBe("string");
    expect(typeof serialized.finalReport).toBe("string");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// STATE SERIALIZATION / DESERIALIZATION
// ═════════════════════════════════════════════════════════════════════════════

describe("State Serialization / Deserialization", () => {
  it("should lose class identity after JSON round-trip (core bug we fixed)", () => {
    const humanMsg = new HumanMessage("hello");
    const serialized = serializeAndDeserialize(humanMsg);

    // After serialization, it's a plain object — instanceof fails
    expect(serialized instanceof HumanMessage).toBe(false);
    // The key insight: _type is on the prototype, so JSON.stringify won't include it
    // This is exactly WHY the fix was needed — deserialized messages lose _type
    expect(serialized).not.toHaveProperty("_type");
  });

  it("should correctly identify deserialized human messages via _type check", () => {
    const plainObj = plainHumanMessage("yes");

    // Our fixed check: _type === "human" || type === "human" || instanceof HumanMessage
    const isHuman = plainObj._type === "human" || plainObj.type === "human" || plainObj instanceof HumanMessage;
    expect(isHuman).toBe(true);
  });

  it("should correctly identify deserialized AI messages as NOT human", () => {
    const plainObj = plainAIMessage("response");

    const isHuman = plainObj._type === "human" || plainObj.type === "human" || plainObj instanceof HumanMessage;
    expect(isHuman).toBe(false);
  });

  it("should preserve messages array through serialization round-trip", () => {
    const messages: any[] = [
      plainHumanMessage("first"),
      plainAIMessage("response"),
      { _type: "system", content: "system prompt", type: "system" },
    ];

    const deserialized = serializeAndDeserialize(messages);

    expect(deserialized).toHaveLength(3);
    expect(deserialized[0]._type).toBe("human");
    expect(deserialized[0].content).toBe("first");
    expect(deserialized[1]._type).toBe("ai");
    expect(deserialized[1].content).toBe("response");
    expect(deserialized[2]._type).toBe("system");
  });

  it("should preserve nested state fields through serialization", () => {
    const state = {
      userId: "user-1",
      classifications: [
        { id: "tx-1", date: "2026-01-15", amount: 100, description: "Test", category: "Food", type: "business" },
      ],
      currentIndex: 1,
      awaitingUserInput: true,
      questionToUser: "Business or personal?",
      messages: [plainHumanMessage("business")],
    };

    const deserialized = serializeAndDeserialize(state);

    expect(deserialized.classifications[0].type).toBe("business");
    expect(deserialized.currentIndex).toBe(1);
    expect(deserialized.awaitingUserInput).toBe(true);
    expect(deserialized.messages[0]._type).toBe("human");
  });

  it("should preserve dates as strings through serialization", () => {
    const state = {
      date: new Date("2026-01-15"),
      nested: { createdAt: new Date("2026-06-01") },
    };

    const deserialized = serializeAndDeserialize(state);

    expect(typeof deserialized.date).toBe("string");
    expect(deserialized.date).toBe("2026-01-15T00:00:00.000Z");
  });
});
