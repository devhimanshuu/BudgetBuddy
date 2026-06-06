import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import Groq from "groq-sdk";
import { ChatWithAIHeadless } from "@/lib/telegram-ai";
import { syncTransactionToNotion } from "@/lib/notion";

const getGroqClient = () => new Groq({ apiKey: process.env.GROQ_API_KEY });
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN || "";
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET || "";

// Verify Slack Request Signature
async function verifySlackRequest(req: Request, rawBody: string) {
  if (!SLACK_SIGNING_SECRET) return true; // Skip if no secret set

  const signature = req.headers.get("x-slack-signature");
  const timestamp = req.headers.get("x-slack-request-timestamp");

  if (!signature || !timestamp) return false;

  // Protect against replay attacks (5 mins)
  if (Math.abs(Date.now() / 1000 - parseInt(timestamp, 10)) > 60 * 5) return false;

  const sigBaseString = `v0:${timestamp}:${rawBody}`;
  const mySignature = "v0=" + crypto.createHmac("sha256", SLACK_SIGNING_SECRET).update(sigBaseString).digest("hex");

  return crypto.timingSafeEqual(Buffer.from(mySignature), Buffer.from(signature));
}

// Send Slack Message Helper
async function sendSlackMessage(token: string, channel: string, text: string, blocks?: any[]) {
  await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ channel, text, blocks }),
  });
}

// Download Slack File
async function downloadSlackFile(token: string, url: string) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Helper: Ensure Category Exists
async function ensureCategory(workspaceId: string, userId: string, categoryName: string, type: string) {
  let icon = "🏷️";
  const nameLower = categoryName.toLowerCase();
  if (nameLower.includes("food") || nameLower.includes("dining")) icon = "🍔";
  else if (nameLower.includes("transport")) icon = "🚗";
  else if (nameLower.includes("salary")) icon = "💰";
  else if (nameLower.includes("grocery")) icon = "🛒";
  else if (nameLower.includes("health")) icon = "💊";

  return await prisma.category.upsert({
    where: { name_userId_type: { name: categoryName, userId, type } },
    update: {},
    create: {
      name: categoryName,
      userId,
      workspaceId,
      icon,
      type,
      color: "#3b82f6"
    }
  });
}

// Helper: Ensure Tags Exist and return their IDs
async function ensureTags(workspaceId: string, userId: string, tagNames: string[]) {
  const tagIds = [];
  for (const name of tagNames) {
    const cleanName = name.trim().replace(/^#/, '');
    if (!cleanName) continue;
    
    const tag = await prisma.tag.upsert({
      where: { name_userId: { name: cleanName, userId } },
      update: {},
      create: { name: cleanName, userId, workspaceId, color: "#8b5cf6" }
    });
    
    tagIds.push(tag.id);
  }
  return tagIds;
}

// Helper: Save the Transaction manually
async function saveDraftTransaction(userId: string, workspaceId: string, draft: any) {
  const date = new Date();
  
  const createdTx = await prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.create({
      data: {
        userId,
        workspaceId,
        amount: draft.amount,
        description: draft.description || draft.category,
        notes: draft.notes || null,
        date,
        type: draft.type,
        category: draft.category,
        categoryIcon: draft.categoryIcon || "🏷️",
        status: "APPROVED"
      }
    });

    if (draft.tagIds && draft.tagIds.length > 0) {
      await tx.transactionTag.createMany({
        data: draft.tagIds.map((tagId: string) => ({
          transactionId: transaction.id,
          tagId
        }))
      });
    }

    if (draft.splits && draft.splits.length > 0) {
      await tx.transactionSplit.createMany({
        data: draft.splits.map((s: any) => ({
          transactionId: transaction.id,
          category: s.category,
          categoryIcon: s.categoryIcon || "🏷️",
          amount: s.amount,
          percentage: (s.amount / draft.amount) * 100
        }))
      });
    }

    // Update Aggregates
    await tx.monthlyHistory.upsert({
      where: { day_month_year_userId: { userId, day: date.getUTCDate(), month: date.getUTCMonth(), year: date.getUTCFullYear() } },
      create: { userId, workspaceId, day: date.getUTCDate(), month: date.getUTCMonth(), year: date.getUTCFullYear(), expense: draft.type === "expense" ? draft.amount : 0, income: draft.type === "income" ? draft.amount : 0, investment: draft.type === "investment" ? draft.amount : 0 },
      update: { expense: { increment: draft.type === "expense" ? draft.amount : 0 }, income: { increment: draft.type === "income" ? draft.amount : 0 }, investment: { increment: draft.type === "investment" ? draft.amount : 0 } }
    });

    await tx.yearHistory.upsert({
      where: { month_year_userId: { userId, month: date.getUTCMonth(), year: date.getUTCFullYear() } },
      create: { userId, workspaceId, month: date.getUTCMonth(), year: date.getUTCFullYear(), expense: draft.type === "expense" ? draft.amount : 0, income: draft.type === "income" ? draft.amount : 0, investment: draft.type === "investment" ? draft.amount : 0 },
      update: { expense: { increment: draft.type === "expense" ? draft.amount : 0 }, income: { increment: draft.type === "income" ? draft.amount : 0 }, investment: { increment: draft.type === "investment" ? draft.amount : 0 } }
    });
    
    return transaction;
  });

  // Await External Syncs
  try {
    await syncTransactionToNotion(createdTx.id);
  } catch (error) {
    console.error("Notion Sync Error:", error);
  }

  try {
    const splitwiseModule = await import('@/lib/splitwise');
    await splitwiseModule.pushExpenseToSplitwise(createdTx.id);
  } catch (error) {
    console.error("Splitwise Sync Error:", error);
  }
}


export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const isValid = await verifySlackRequest(req, rawBody);
    if (!isValid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = JSON.parse(rawBody);

    // 1. URL Verification Challenge
    if (body.type === "url_verification") {
      return NextResponse.json({ challenge: body.challenge });
    }

    // 2. Event Callback (Messages)
    if (body.type === "event_callback") {
      const event = body.event;

      // Ignore bot messages or events without text/files
      if (event.bot_id || (!event.text && !event.files)) {
        return NextResponse.json({ ok: true });
      }

      // Only handle direct messages (or app mentions, but we'll focus on DMs)
      if (event.type === "message" && event.channel_type === "im") {
        const slackUserId = event.user;
        const channelId = event.channel;
        const teamId = body.team_id;
        let text = event.text || "";

        // Acknowledge Slack quickly to avoid retries
        (async () => {
          try {
            const installation = await prisma.slackInstallation.findUnique({ where: { teamId } });
            if (!installation) return;
            const botToken = installation.botToken;

            const userSettings = await prisma.userSettings.findUnique({ where: { slackUserId } });
            if (!userSettings) {
              await sendSlackMessage(botToken, channelId, `❌ Your Slack account is not linked to BudgetBuddy. Please link it in the dashboard.`);
              return;
            }

            const membership = await prisma.workspaceMember.findFirst({ where: { userId: userSettings.userId, deletedAt: null } });
            if (!membership) {
              await sendSlackMessage(botToken, channelId, "❌ You don't have any active workspaces.");
              return;
            }
            const workspaceId = membership.workspaceId;

            // Get or Create Session
            let session = await prisma.slackSession.findUnique({ where: { slackId: slackUserId } });
            if (!session) {
              session = await prisma.slackSession.create({
                data: { slackId: slackUserId, userId: userSettings.userId, state: "IDLE", context: {} }
              });
            }

            // Global Commands
            const helpText = `🤖 **How to use BudgetBuddy Slack Bot**\n\n📝 **Text:** "50 for food"\n🎙️ **Voice:** Upload an audio file\n📸 **Receipt:** Upload a photo\n💬 **Chat:** Type \`/chatbot\` to start talking to your advisor\n🚗 **Drive:** Type \`/drive\` for hands-free voice mode\n🧑‍💼 **Tax Audit:** Type \`/taxaudit [year]\`\n🎮 **Challenges:** Type \`/challenge\`\n\nType \`/exit\` or \`/cancel\` at any time.`;

            if (text && (text.toLowerCase() === "/start" || text.toLowerCase() === "/help" || text.toLowerCase() === "help")) {
              await prisma.slackSession.update({
                where: { slackId: slackUserId }, data: { state: "IDLE", context: {} }
              });
              await sendSlackMessage(botToken, channelId, helpText);
              return;
            }

            if (text && (text.toLowerCase() === "/cancel" || text.toLowerCase() === "/exit" || text.toLowerCase() === "exit" || text.toLowerCase() === "cancel")) {
              await prisma.slackSession.update({
                where: { slackId: slackUserId }, data: { state: "IDLE", context: {} }
              });
              await sendSlackMessage(botToken, channelId, "✅ Action cancelled. Back to normal mode.");
              return;
            }

            if (text && text.toLowerCase() === "/chatbot") {
              await prisma.slackSession.update({
                where: { slackId: slackUserId }, data: { state: "CHATBOT", context: { history: [] } }
              });
              await sendSlackMessage(botToken, channelId, "🤖 **BudgetBuddy AI Chatbot Activated!**\nAsk me anything. (Type \`/exit\` to leave)");
              return;
            }

            if (text && text.toLowerCase().startsWith("/taxaudit")) {
              const yearStr = text.split(" ")[1];
              const year = yearStr ? parseInt(yearStr) : new Date().getFullYear();
              
              const { createTaxAuditorGraph } = await import("@/agent/workflows/tax-auditor");
              const initialState = {
                userId: userSettings.userId,
                workspaceId,
                year,
                transactions: [],
                currentIndex: 0,
                classifications: [],
                awaitingUserInput: false,
                questionToUser: null,
                reportUrl: null,
                messages: [],
              };

              const agentSession = await prisma.agentSession.create({
                data: {
                  userId: userSettings.userId,
                  workflowType: "TAX_AUDIT",
                  state: JSON.parse(JSON.stringify(initialState)),
                }
              });

              await prisma.slackSession.update({
                where: { slackId: slackUserId }, data: { state: "TAX_AUDITOR", context: { sessionId: agentSession.id } }
              });
              await sendSlackMessage(botToken, channelId, `🧑‍💼 **Tax Auditor Activated!** Reviewing transactions for ${year}...`);
              
              const graph = createTaxAuditorGraph();
              const finalState: any = await graph.invoke(initialState);
              
              await prisma.agentSession.update({
                where: { id: agentSession.id },
                data: { state: JSON.parse(JSON.stringify(finalState)) }
              });

              if (finalState.awaitingUserInput) {
                await sendSlackMessage(botToken, channelId, finalState.questionToUser || "Please clarify.");
              } else if (finalState.reportUrl) {
                await sendSlackMessage(botToken, channelId, `✅ Audit Complete! Download your Tax Report here:\n\n${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}${finalState.reportUrl}`);
                await prisma.slackSession.update({
                  where: { slackId: slackUserId }, data: { state: "IDLE", context: {} }
                });
              }
              return;
            }

            if (text && text.toLowerCase() === "/drive") {
              await prisma.slackSession.update({
                where: { slackId: slackUserId }, data: { state: "DRIVE_MODE", context: { history: [] } }
              });
              const welcomeText = "🚗 Drive Mode Activated! Hands-free voice chat. (Type \`/exit\` to leave)";
              const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(welcomeText)}&tl=en&client=tw-ob`;
              await sendSlackMessage(botToken, channelId, `${welcomeText}\n🔊 Listen: ${ttsUrl}`);
              return;
            }

            if (text && text.toLowerCase().startsWith("/challenge")) {
              let agentSession = await prisma.agentSession.findFirst({
                where: { userId: userSettings.userId, workflowType: "WEALTH_CHALLENGER", status: "RUNNING" }
              });
              
              let action: "PROPOSE" | "CHECK" = "PROPOSE";
              if (agentSession) {
                action = "CHECK";
              } else {
                agentSession = await prisma.agentSession.create({
                  data: {
                    userId: userSettings.userId,
                    workflowType: "WEALTH_CHALLENGER",
                    state: JSON.parse(JSON.stringify({ userId: userSettings.userId, workspaceId, action: "PROPOSE", awaitingUserInput: false, messages: [] })),
                  }
                });
              }

              await prisma.slackSession.update({
                where: { slackId: slackUserId }, data: { state: "WEALTH_CHALLENGER", context: { sessionId: agentSession.id } }
              });

              const { createWealthChallengerGraph } = await import("@/agent/workflows/wealth-challenger");
              const graph = createWealthChallengerGraph();
              
              let currentState = agentSession.state as any;
              currentState.action = action;
              
              const finalState: any = await graph.invoke(currentState);
              
              await prisma.agentSession.update({
                where: { id: agentSession.id },
                data: { 
                  state: JSON.parse(JSON.stringify(finalState)),
                  status: finalState.challengeResult ? "COMPLETED" : "RUNNING"
                }
              });

              if (finalState.awaitingUserInput) {
                await sendSlackMessage(botToken, channelId, finalState.questionToUser || "Do you accept this challenge?");
              } else if (finalState.finalMessage) {
                await sendSlackMessage(botToken, channelId, finalState.finalMessage);
                await prisma.slackSession.update({
                  where: { slackId: slackUserId }, data: { state: "IDLE", context: {} }
                });
              }
              return;
            }

            // File parsing (Voice or Receipts)
            if (event.files && event.files.length > 0) {
              const file = event.files[0];
              if (file.mimetype.startsWith("audio/")) {
                const buffer = await downloadSlackFile(botToken, file.url_private_download);
                const blob = new Blob([new Uint8Array(buffer)], { type: file.mimetype });
                const audioFile = new File([blob], file.name, { type: file.mimetype });

                const transcription = await getGroqClient().audio.transcriptions.create({
                  file: audioFile,
                  model: "whisper-large-v3-turbo",
                });
                text = transcription.text.trim();
              } else if (file.mimetype.startsWith("image/")) {
                const buffer = await downloadSlackFile(botToken, file.url_private_download);
                const base64 = `data:${file.mimetype};base64,${buffer.toString("base64")}`;
                
                const initialState = {
                  userId: userSettings.userId,
                  workspaceId,
                  imageBase64: base64,
                  isGroupMeal: false,
                  awaitingUserInput: false,
                  messages: [],
                };
                
                const agentSession = await prisma.agentSession.create({
                  data: {
                    userId: userSettings.userId,
                    workflowType: "RECEIPT_SCANNER",
                    state: JSON.parse(JSON.stringify(initialState)),
                  }
                });
                
                await prisma.slackSession.update({
                  where: { slackId: slackUserId }, data: { state: "RECEIPT_SCANNER", context: { sessionId: agentSession.id } }
                });
                
                await sendSlackMessage(botToken, channelId, "📸 Scanning receipt and looking for splits... please wait.");

                const { createReceiptScannerGraph } = await import("@/agent/workflows/receipt-scanner");
                const graph = createReceiptScannerGraph();
                const finalState: any = await graph.invoke(initialState);
                
                await prisma.agentSession.update({
                  where: { id: agentSession.id },
                  data: { state: JSON.parse(JSON.stringify(finalState)) }
                });

                if (finalState.awaitingUserInput) {
                  await sendSlackMessage(botToken, channelId, finalState.questionToUser || "Please clarify.");
                } else if (finalState.finalMessage) {
                  await sendSlackMessage(botToken, channelId, finalState.finalMessage);
                  await prisma.slackSession.update({
                    where: { slackId: slackUserId }, data: { state: "IDLE", context: {} }
                  });
                }
                return;
              }
            }

            // State Machine Router
            const state = session.state;
            const context: any = session.context || {};

            if (state === "CHATBOT") {
              const history = context.history || [];
              const responseText = await ChatWithAIHeadless(userSettings.userId, text, history);
              history.push({ role: "user", content: text });
              history.push({ role: "assistant", content: responseText });
              const prunedHistory = history.slice(-10);
              await prisma.slackSession.update({
                where: { slackId: slackUserId }, data: { context: { ...context, history: prunedHistory } }
              });
              const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(responseText.substring(0, 200))}&tl=en&client=tw-ob`;
              await sendSlackMessage(botToken, channelId, `${responseText}\n🔊 Listen: ${ttsUrl}`);
              return;
            }

            if (state === "TAX_AUDITOR") {
              const sessionId = context.sessionId;
              const agentSession = await prisma.agentSession.findUnique({ where: { id: sessionId } });
              if (agentSession) {
                const { createTaxAuditorGraph } = await import("@/agent/workflows/tax-auditor");
                const graph = createTaxAuditorGraph();
                let currentState = agentSession.state as any;
                currentState.messages.push({ _type: "human", content: text, type: "human", role: "user" });
                const finalState: any = await graph.invoke(currentState);
                await prisma.agentSession.update({
                  where: { id: sessionId },
                  data: { state: JSON.parse(JSON.stringify(finalState)) }
                });
                if (finalState.awaitingUserInput) {
                  await sendSlackMessage(botToken, channelId, finalState.questionToUser || "Please clarify.");
                } else if (finalState.reportUrl) {
                  await sendSlackMessage(botToken, channelId, `✅ Audit Complete! Download your Tax Report here:\n\n${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}${finalState.reportUrl}`);
                  await prisma.slackSession.update({
                    where: { slackId: slackUserId }, data: { state: "IDLE", context: {} }
                  });
                }
              }
              return;
            }

            if (state === "RECEIPT_SCANNER") {
              const sessionId = context.sessionId;
              const agentSession = await prisma.agentSession.findUnique({ where: { id: sessionId } });
              if (agentSession) {
                const { createReceiptScannerGraph } = await import("@/agent/workflows/receipt-scanner");
                const graph = createReceiptScannerGraph();
                let currentState = agentSession.state as any;
                currentState.messages.push({ _type: "human", content: text, type: "human", role: "user" });
                const finalState: any = await graph.invoke(currentState);
                await prisma.agentSession.update({
                  where: { id: sessionId },
                  data: { state: JSON.parse(JSON.stringify(finalState)) }
                });
                if (finalState.awaitingUserInput) {
                  await sendSlackMessage(botToken, channelId, finalState.questionToUser || "Please clarify.");
                } else if (finalState.finalMessage) {
                  await sendSlackMessage(botToken, channelId, finalState.finalMessage);
                  await prisma.slackSession.update({
                    where: { slackId: slackUserId }, data: { state: "IDLE", context: {} }
                  });
                }
              }
              return;
            }

            if (state === "DRIVE_MODE") {
              const history = context.history || [];
              const responseText = await ChatWithAIHeadless(userSettings.userId, text, history);
              history.push({ role: "user", content: text });
              history.push({ role: "assistant", content: responseText });
              const prunedHistory = history.slice(-10);
              await prisma.slackSession.update({
                where: { slackId: slackUserId }, data: { context: { ...context, history: prunedHistory } }
              });
              const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(responseText.substring(0, 200))}&tl=en&client=tw-ob`;
              await sendSlackMessage(botToken, channelId, `${responseText}\n🔊 Listen: ${ttsUrl}`);
              return;
            }

            if (state === "WEALTH_CHALLENGER") {
              const sessionId = context.sessionId;
              const agentSession = await prisma.agentSession.findUnique({ where: { id: sessionId } });
              if (agentSession) {
                const { createWealthChallengerGraph } = await import("@/agent/workflows/wealth-challenger");
                const graph = createWealthChallengerGraph();
                let currentState = agentSession.state as any;
                currentState.messages.push({ _type: "human", content: text, type: "human", role: "user" });
                const finalState: any = await graph.invoke(currentState);
                await prisma.agentSession.update({
                  where: { id: sessionId },
                  data: { 
                    state: JSON.parse(JSON.stringify(finalState)),
                    status: finalState.challengeResult ? "COMPLETED" : "RUNNING"
                  }
                });
                if (finalState.awaitingUserInput) {
                  await sendSlackMessage(botToken, channelId, finalState.questionToUser || "Please clarify.");
                } else if (finalState.finalMessage) {
                  await sendSlackMessage(botToken, channelId, finalState.finalMessage);
                  await prisma.slackSession.update({
                    where: { slackId: slackUserId }, data: { state: "IDLE", context: {} }
                  });
                }
              }
              return;
            }

            if (state === "AWAITING_NOTES") {
              if (text.toLowerCase() !== "skip") context.notes = text;
              await prisma.slackSession.update({
                where: { slackId: slackUserId }, data: { state: "AWAITING_TAGS", context }
              });

              const blocks = [
                {
                  type: "section",
                  text: {
                    type: "mrkdwn",
                    text: `🏷️ Would you like to add **Tags**? (Reply with tags separated by commas, e.g. "vacation, family", or click Skip)`
                  }
                },
                {
                  type: "actions",
                  elements: [
                    {
                      type: "button",
                      text: { type: "plain_text", text: "⏭️ Skip Tags" },
                      value: "skip",
                      action_id: "skip_tags"
                    }
                  ]
                }
              ];
              await sendSlackMessage(botToken, channelId, "Tags request:", blocks);
              return;
            }

            if (state === "AWAITING_TAGS") {
              if (text.toLowerCase() !== "skip") {
                const tagNames = text.split(",").map((t: string) => t.trim()).filter(Boolean);
                context.tagIds = await ensureTags(workspaceId, userSettings.userId, tagNames);
              }
              await prisma.slackSession.update({
                where: { slackId: slackUserId }, data: { state: "AWAITING_SPLITS", context }
              });

              const blocks = [
                {
                  type: "section",
                  text: {
                    type: "mrkdwn",
                    text: `✂️ Would you like to **Split** this across other categories? (Reply with amounts and categories, e.g. "10 to Drinks", or click Skip)`
                  }
                },
                {
                  type: "actions",
                  elements: [
                    {
                      type: "button",
                      text: { type: "plain_text", text: "⏭️ Skip Splits" },
                      value: "skip",
                      action_id: "skip_splits"
                    }
                  ]
                }
              ];
              await sendSlackMessage(botToken, channelId, "Splits request:", blocks);
              return;
            }

            if (state === "AWAITING_SPLITS") {
              if (text.toLowerCase() !== "skip") {
                const prompt = `
                  The user is splitting a total expense of ${context.amount} across other categories.
                  Extract the splits. User message: "${text}"
                  Output ONLY a valid JSON array of objects. Example: [{"amount": 10, "category": "Drinks"}]
                `;
                const response = await getGroqClient().chat.completions.create({
                  model: "llama-3.3-70b-versatile",
                  messages: [{ role: "user", content: prompt }],
                  temperature: 0,
                });
                const jsonMatch = (response.choices[0].message.content || "").match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                  const splits = JSON.parse(jsonMatch[0]);
                  for (const s of splits) {
                    const cat = await ensureCategory(workspaceId, userSettings.userId, s.category, context.type);
                    s.categoryIcon = cat.icon;
                  }
                  context.splits = splits;
                }
              }

              await saveDraftTransaction(userSettings.userId, workspaceId, context);
              
              await prisma.slackSession.update({
                where: { slackId: slackUserId }, data: { state: "IDLE", context: {} }
              });

              const typeEmoji = context.type === "income" ? "📈" : "📉";
              await sendSlackMessage(botToken, channelId, `🎉 **Done!** Transaction fully saved. ${typeEmoji}`);
              return;
            }

            if (state === "IDLE") {
              const prompt = `
                You are an AI assistant parsing expense/income logs for a budgeting app.
                Extract: amount (number), category (string, capitalized), description (short string), type ("expense" or "income").
                Also extract "sentiment" (positive, neutral, negative) and "empatheticResponse" (a short, comforting or encouraging 1-sentence response about their finances if sentiment is negative or highly positive. Otherwise null).
                User's message: "${text}"
                Output ONLY a valid JSON object. Example: {"amount": 50, "category": "Food", "description": "lunch", "type": "expense", "sentiment": "neutral", "empatheticResponse": null}
              `;
              const response = await getGroqClient().chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "user", content: prompt }],
                temperature: 0,
              });

              const jsonMatch = (response.choices[0].message.content || "").match(/\{[\s\S]*\}/);
              if (!jsonMatch) {
                await sendSlackMessage(botToken, channelId, "❌ I couldn't understand that. Try `50 for food`.");
                return;
              }
              
              const parsedData = JSON.parse(jsonMatch[0]);
              if (!parsedData.amount || !parsedData.category || !parsedData.type) {
                const responseText = await ChatWithAIHeadless(userSettings.userId, text, []);
                const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(responseText.substring(0, 200))}&tl=en&client=tw-ob`;
                await sendSlackMessage(botToken, channelId, `${responseText}\n🔊 Listen: ${ttsUrl}`);
                return;
              }

              if (parsedData.empatheticResponse) {
                await sendSlackMessage(botToken, channelId, `💡 ${parsedData.empatheticResponse}`);
              }

              const category = await ensureCategory(workspaceId, userSettings.userId, parsedData.category, parsedData.type);
              parsedData.categoryIcon = category.icon;

              await prisma.slackSession.update({
                where: { slackId: slackUserId },
                data: { state: "AWAITING_NOTES", context: parsedData }
              });

              const blocks = [
                {
                  type: "section",
                  text: {
                    type: "mrkdwn",
                    text: `✅ Drafted: *${userSettings.currency} ${parsedData.amount}* for *${parsedData.category}*.\n\n📝 Would you like to add any *Notes*? (Reply with notes, or click Skip)`
                  }
                },
                {
                  type: "actions",
                  elements: [
                    {
                      type: "button",
                      text: { type: "plain_text", text: "⏭️ Skip Notes" },
                      value: "skip",
                      action_id: "skip_notes"
                    }
                  ]
                }
              ];

              await sendSlackMessage(botToken, channelId, "Notes request:", blocks);
              return;
            }
          } catch (error) {
            console.error("Slack Event Error:", error);
          }
        })();

        return NextResponse.json({ ok: true });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
