/**
 * Integration test: directly invoke each agent workflow to verify they work end-to-end.
 * Run with: npx tsx agent/__tests__/integration.test.ts
 */

import "dotenv/config";

const userId = "test-user-123";
const workspaceId = "test-workspace-123";

async function testTaxAuditor() {
  console.log("\n=== Testing Tax Auditor ===");
  try {
    const { createTaxAuditorGraph } = await import("@/agent/workflows/tax-auditor");
    const graph = createTaxAuditorGraph();
    const result: any = await graph.invoke({
      userId, workspaceId, year: 2025,
      transactions: [], currentIndex: 0, classifications: [],
      awaitingUserInput: false, questionToUser: null, reportUrl: null, messages: [],
    });
    console.log(`✅ Tax Auditor: classifications=${result.classifications.length}, reportUrl=${result.reportUrl}`);
    return true;
  } catch (e: any) { console.error(`❌ Tax Auditor FAILED: ${e.message}`); return false; }
}

async function testMonthlyReview() {
  console.log("\n=== Testing Monthly Review ===");
  try {
    const { createMonthlyReviewGraph } = await import("@/agent/workflows/monthly-review");
    const graph = createMonthlyReviewGraph();
    const result: any = await graph.invoke({
      userId, workspaceId, month: 5, year: 2025,
      financialData: "", accountantReport: "", coachReport: "", finalReport: "",
    });
    console.log(`✅ Monthly Review: finalReport length=${result.finalReport.length}`);
    console.log(`   Preview: ${result.finalReport.substring(0, 100)}...`);
    return true;
  } catch (e: any) { console.error(`❌ Monthly Review FAILED: ${e.message}`); return false; }
}

async function testSubscriptionAdvisor() {
  console.log("\n=== Testing Subscription Advisor ===");
  try {
    const { createSubscriptionAdvisorGraph } = await import("@/agent/workflows/subscription-advisor");
    const graph = createSubscriptionAdvisorGraph();
    const result: any = await graph.invoke({
      userId, workspaceId, subscriptions: [], researchResults: [], finalReport: null,
    });
    console.log(`✅ Subscription Advisor: report length=${(result.finalReport || "").length}`);
    console.log(`   Preview: ${(result.finalReport || "none").substring(0, 100)}...`);
    return true;
  } catch (e: any) { console.error(`❌ Subscription Advisor FAILED: ${e.message}`); return false; }
}

async function testWealthChallenger() {
  console.log("\n=== Testing Wealth Challenger (PROPOSE) ===");
  try {
    const { createWealthChallengerGraph } = await import("@/agent/workflows/wealth-challenger");
    const graph = createWealthChallengerGraph();
    const result: any = await graph.invoke({
      userId, workspaceId, action: "PROPOSE",
      awaitingUserInput: false, messages: [],
    });
    console.log(`✅ Wealth Challenger: awaitingUserInput=${result.awaitingUserInput}`);
    if (result.proposedChallenge) {
      console.log(`   Challenge: ${result.proposedChallenge.description} (${result.proposedChallenge.points} XP)`);
    }
    if (result.finalMessage) {
      console.log(`   Message: ${result.finalMessage.substring(0, 100)}...`);
    }
    return true;
  } catch (e: any) { console.error(`❌ Wealth Challenger FAILED: ${e.message}`); return false; }
}

async function testChatbot() {
  console.log("\n=== Testing Chatbot (runAgent) ===");
  try {
    const { runAgent } = await import("@/agent");
    const result = await runAgent(userId, "What is my financial summary?", [], workspaceId);
    console.log(`✅ Chatbot: response length=${result.length}`);
    console.log(`   Preview: ${result.substring(0, 150)}...`);
    return true;
  } catch (e: any) { console.error(`❌ Chatbot FAILED: ${e.message}`); return false; }
}

async function main() {
  console.log("🧪 BudgetBuddy Agent Integration Tests");
  console.log("======================================");

  const results: boolean[] = [];
  results.push(await testTaxAuditor());
  results.push(await testMonthlyReview());
  results.push(await testSubscriptionAdvisor());
  results.push(await testWealthChallenger());
  results.push(await testChatbot());

  const passed = results.filter(Boolean).length;
  console.log(`\n======================================`);
  console.log(`Results: ${passed}/${results.length} tests passed`);

  if (passed === results.length) {
    console.log("🎉 All agent features working!");
  } else {
    console.log("⚠️  Some features failed - check logs above");
  }
}

main().catch(console.error);
