import { NextResponse } from "next/server";
import { verifyKey } from "discord-interactions";
import prisma from "@/lib/prisma";
import Groq, { toFile } from "groq-sdk";
import { ChatWithAIHeadless } from "@/lib/telegram-ai";
import { ExtractReceiptData } from "@/app/(dashboard)/_actions/extractReceipt";
import { syncTransactionToNotion } from "@/lib/notion";

const getGroqClient = () => new Groq({ apiKey: process.env.GROQ_API_KEY });
const APP_ID = process.env.DISCORD_APP_ID || "1510015130547654717";
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

// Verification Helper
async function verifyDiscordRequest(req: Request) {
  const signature = req.headers.get("x-signature-ed25519");
  const timestamp = req.headers.get("x-signature-timestamp");
  const rawBody = await req.text();

  if (!signature || !timestamp) return { isValid: false, body: null };

  const isValid = verifyKey(rawBody, signature, timestamp, process.env.DISCORD_PUBLIC_KEY!);
  return { isValid, body: JSON.parse(rawBody) };
}

// Download Discord Attachment Helper
async function downloadDiscordAttachment(url: string) {
  const res = await fetch(url);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Edit Interaction Response Helper
async function editInteractionResponse(token: string, content: string, components?: any[], fileData?: { name: string, buffer: Buffer, type: string }) {
  const url = `https://discord.com/api/v10/webhooks/${APP_ID}/${token}/messages/@original`;
  
  if (fileData) {
    const formData = new FormData();
    formData.append("payload_json", JSON.stringify({ content, components }));
    formData.append("files[0]", new Blob([new Uint8Array(fileData.buffer)], { type: fileData.type }), fileData.name);
    
    await fetch(url, { method: "PATCH", body: formData });
  } else {
    await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, components: components || [] })
    });
  }
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
    const { isValid, body } = await verifyDiscordRequest(req);
    if (!isValid) return NextResponse.json({ error: "Bad request signature" }, { status: 401 });
    if (body.type === 1) return NextResponse.json({ type: 1 });

    const discordUserId = body.member?.user?.id || body.user?.id;
    const interactionToken = body.token;

    // Handle Slash Commands (Type 2)
    if (body.type === 2) {
      const commandName = body.data.name;

      if (commandName === "start") {
        return NextResponse.json({
          type: 4,
          data: { content: `👋 **Welcome!** To link your account, go to BudgetBuddy Web -> Manage -> Discord Integration and paste your Discord User ID: \`${discordUserId}\`` }
        });
      }

      const userSettings = await prisma.userSettings.findUnique({ where: { discordUserId } });
      if (!userSettings) {
        return NextResponse.json({ type: 4, data: { content: "❌ Your account is not linked. Link it in settings." } });
      }

      const membership = await prisma.workspaceMember.findFirst({ where: { userId: userSettings.userId, deletedAt: null } });
      if (!membership) return NextResponse.json({ type: 4, data: { content: "❌ You don't have active workspaces." } });
      const workspaceId = membership.workspaceId;

      // Get or Create Session
      let session = await prisma.discordSession.findUnique({ where: { discordId: discordUserId } });
      if (!session) {
        session = await prisma.discordSession.create({
          data: { discordId: discordUserId, userId: userSettings.userId, state: "IDLE", context: {} }
        });
      }

      const helpText = `🤖 **How to use BudgetBuddy Discord Bot**\n\nUse \`/log\` to record transactions.\nUse \`/chat\` to converse, answer wizard questions, or use chatbot/agent modes.\nUse \`/chatbot\` to start the advisor.\nUse \`/drive\` for hands-free voice mode.\nUse \`/taxaudit\` for taxes.\nUse \`/challenge\` for gamification.`;

      if (commandName === "help") {
        await prisma.discordSession.update({
          where: { discordId: discordUserId }, data: { state: "IDLE", context: {} }
        });
        return NextResponse.json({ type: 4, data: { content: helpText } });
      }

      if (commandName === "cancel" || commandName === "exit") {
        await prisma.discordSession.update({
          where: { discordId: discordUserId }, data: { state: "IDLE", context: {} }
        });
        return NextResponse.json({ type: 4, data: { content: "✅ Action cancelled. Back to normal mode." } });
      }

      if (commandName === "chatbot") {
        await prisma.discordSession.update({
          where: { discordId: discordUserId }, data: { state: "CHATBOT", context: { history: [] } }
        });
        return NextResponse.json({ type: 4, data: { content: "🤖 **BudgetBuddy AI Chatbot Activated!**\nAsk me anything via `/chat [message]`. (Type `/exit` to leave)" } });
      }

      if (commandName === "drive") {
        await prisma.discordSession.update({
          where: { discordId: discordUserId }, data: { state: "DRIVE_MODE", context: { history: [] } }
        });
        
        (async () => {
          try {
            const welcomeText = "🚗 Drive Mode Activated! Hands-free voice chat. Use `/chat` to speak. (Type `/exit` to leave)";
            const shortText = welcomeText.substring(0, 200);
            const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(shortText)}&tl=en&client=tw-ob`;
            const res = await fetch(ttsUrl);
            if (res.ok) {
              const audioBuffer = Buffer.from(await res.arrayBuffer());
              await editInteractionResponse(interactionToken, welcomeText, [], { name: "reply.ogg", buffer: audioBuffer, type: "audio/ogg" });
            } else {
              await editInteractionResponse(interactionToken, welcomeText);
            }
          } catch (e) {}
        })();

        return NextResponse.json({ type: 5 });
      }

      if (commandName === "taxaudit") {
        const yearOption = body.data.options?.find((o: any) => o.name === "year");
        const year = yearOption ? yearOption.value : new Date().getFullYear();

        (async () => {
          try {
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

            await prisma.discordSession.update({
              where: { discordId: discordUserId }, data: { state: "TAX_AUDITOR", context: { sessionId: agentSession.id } }
            });
            await editInteractionResponse(interactionToken, `🧑‍💼 **Tax Auditor Activated!** Reviewing transactions for ${year}...`);
            
            const graph = createTaxAuditorGraph();
            const finalState: any = await graph.invoke(initialState);
            
            await prisma.agentSession.update({
              where: { id: agentSession.id },
              data: { state: JSON.parse(JSON.stringify(finalState)) }
            });

            if (finalState.awaitingUserInput) {
              await editInteractionResponse(interactionToken, finalState.questionToUser || "Please clarify.");
            } else if (finalState.reportUrl) {
              await editInteractionResponse(interactionToken, `✅ Audit Complete! Download your Tax Report here:\n\n${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}${finalState.reportUrl}`);
              await prisma.discordSession.update({
                where: { discordId: discordUserId }, data: { state: "IDLE", context: {} }
              });
            }
          } catch(e) {
            await editInteractionResponse(interactionToken, "❌ Failed to start Tax Auditor.");
          }
        })();

        return NextResponse.json({ type: 5 });
      }

      if (commandName === "challenge") {
        (async () => {
          try {
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

            await prisma.discordSession.update({
              where: { discordId: discordUserId }, data: { state: "WEALTH_CHALLENGER", context: { sessionId: agentSession.id } }
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
              await editInteractionResponse(interactionToken, finalState.questionToUser || "Do you accept this challenge?");
            } else if (finalState.finalMessage) {
              await editInteractionResponse(interactionToken, finalState.finalMessage);
              await prisma.discordSession.update({
                where: { discordId: discordUserId }, data: { state: "IDLE", context: {} }
              });
            }
          } catch(e) {
            await editInteractionResponse(interactionToken, "❌ Failed to run challenge.");
          }
        })();

        return NextResponse.json({ type: 5 });
      }

      if (commandName === "log") {
        const textOption = body.data.options?.find((o: any) => o.name === "text");
        const receiptOption = body.data.options?.find((o: any) => o.name === "receipt");
        const voiceOption = body.data.options?.find((o: any) => o.name === "voice");
        
        let text = textOption ? textOption.value : "";

        (async () => {
          try {
            if (receiptOption) {
              const attachmentId = receiptOption.value;
              const attachmentObj = body.data.resolved.attachments[attachmentId];
              await editInteractionResponse(interactionToken, "📸 Scanning receipt... please wait.");
              const buffer = await downloadDiscordAttachment(attachmentObj.url);
              const base64 = `data:${attachmentObj.content_type};base64,${buffer.toString("base64")}`;
              
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
              
              await prisma.discordSession.update({
                where: { discordId: discordUserId }, data: { state: "RECEIPT_SCANNER", context: { sessionId: agentSession.id } }
              });

              const { createReceiptScannerGraph } = await import("@/agent/workflows/receipt-scanner");
              const graph = createReceiptScannerGraph();
              const finalState: any = await graph.invoke(initialState);
              
              await prisma.agentSession.update({
                where: { id: agentSession.id },
                data: { state: JSON.parse(JSON.stringify(finalState)) }
              });

              if (finalState.awaitingUserInput) {
                await editInteractionResponse(interactionToken, finalState.questionToUser || "Please clarify.");
              } else if (finalState.finalMessage) {
                await editInteractionResponse(interactionToken, finalState.finalMessage);
                await prisma.discordSession.update({
                  where: { discordId: discordUserId }, data: { state: "IDLE", context: {} }
                });
              }
              return;
            }

            if (voiceOption) {
              const attachmentId = voiceOption.value;
              const attachmentObj = body.data.resolved.attachments[attachmentId];
              await editInteractionResponse(interactionToken, "🎙️ Transcribing voice note... please wait.");
              const buffer = await downloadDiscordAttachment(attachmentObj.url);
              const file = await toFile(buffer, "audio.ogg", { type: "audio/ogg" });
              const transcription = await getGroqClient().audio.transcriptions.create({
                file: file,
                model: "whisper-large-v3-turbo",
              });
              text = transcription.text.trim();
            }

            if (!text) {
              return editInteractionResponse(interactionToken, "❌ Please provide text, a receipt, or a voice note.");
            }

            // Parse initial transaction log
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
              return editInteractionResponse(interactionToken, "❌ I couldn't understand that transaction.");
            }

            const parsedData = JSON.parse(jsonMatch[0]);
            if (!parsedData.amount || !parsedData.category || !parsedData.type) {
              const responseText = await ChatWithAIHeadless(userSettings.userId, text, []);
              const shortText = responseText.substring(0, 200);
              const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(shortText)}&tl=en&client=tw-ob`;
              const res = await fetch(ttsUrl);
              if (res.ok) {
                const audioBuffer = Buffer.from(await res.arrayBuffer());
                await editInteractionResponse(interactionToken, responseText, [], { name: "reply.ogg", buffer: audioBuffer, type: "audio/ogg" });
              } else {
                await editInteractionResponse(interactionToken, responseText);
              }
              return;
            }

            if (parsedData.empatheticResponse) {
              await editInteractionResponse(interactionToken, `💡 ${parsedData.empatheticResponse}`);
            }

            const category = await ensureCategory(workspaceId, userSettings.userId, parsedData.category, parsedData.type);
            parsedData.categoryIcon = category.icon;

            await prisma.discordSession.update({
              where: { discordId: discordUserId },
              data: { state: "AWAITING_NOTES", context: parsedData }
            });

            const components = [{
              type: 1,
              components: [
                { type: 2, style: 1, label: "⏭️ Skip Notes", custom_id: "skip_notes" }
              ]
            }];

            await editInteractionResponse(interactionToken, `✅ Drafted: **${userSettings.currency} ${parsedData.amount}** for **${parsedData.category}**.\n\nWould you like to add any **Notes**? (Reply via \`/chat [notes]\` or click Skip)`, components);
          } catch (e) {
            console.error(e);
            await editInteractionResponse(interactionToken, "❌ An error occurred.");
          }
        })();

        return NextResponse.json({ type: 5 }); // DEFERRED
      }

      if (commandName === "chat") {
        const messageOption = body.data.options?.find((o: any) => o.name === "message");
        const text = messageOption ? messageOption.value : "";

        (async () => {
          try {
            const state = session.state;
            const context: any = session.context || {};

            if (state === "CHATBOT") {
              const history = context.history || [];
              const responseText = await ChatWithAIHeadless(userSettings.userId, text, history);
              history.push({ role: "user", content: text });
              history.push({ role: "assistant", content: responseText });
              const prunedHistory = history.slice(-10);
              await prisma.discordSession.update({
                where: { discordId: discordUserId }, data: { context: { ...context, history: prunedHistory } }
              });
              
              const shortText = responseText.substring(0, 200);
              const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(shortText)}&tl=en&client=tw-ob`;
              const res = await fetch(ttsUrl);
              if (res.ok) {
                const audioBuffer = Buffer.from(await res.arrayBuffer());
                await editInteractionResponse(interactionToken, responseText, [], { name: "reply.ogg", buffer: audioBuffer, type: "audio/ogg" });
              } else {
                await editInteractionResponse(interactionToken, responseText);
              }
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
                  await editInteractionResponse(interactionToken, finalState.questionToUser || "Please clarify.");
                } else if (finalState.reportUrl) {
                  await editInteractionResponse(interactionToken, `✅ Audit Complete! Download your Tax Report here:\n\n${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}${finalState.reportUrl}`);
                  await prisma.discordSession.update({
                    where: { discordId: discordUserId }, data: { state: "IDLE", context: {} }
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
                  await editInteractionResponse(interactionToken, finalState.questionToUser || "Please clarify.");
                } else if (finalState.finalMessage) {
                  await editInteractionResponse(interactionToken, finalState.finalMessage);
                  await prisma.discordSession.update({
                    where: { discordId: discordUserId }, data: { state: "IDLE", context: {} }
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
              await prisma.discordSession.update({
                where: { discordId: discordUserId }, data: { context: { ...context, history: prunedHistory } }
              });
              
              const shortText = responseText.substring(0, 200);
              const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(shortText)}&tl=en&client=tw-ob`;
              const res = await fetch(ttsUrl);
              if (res.ok) {
                const audioBuffer = Buffer.from(await res.arrayBuffer());
                await editInteractionResponse(interactionToken, responseText, [], { name: "reply.ogg", buffer: audioBuffer, type: "audio/ogg" });
              } else {
                await editInteractionResponse(interactionToken, responseText);
              }
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
                  await editInteractionResponse(interactionToken, finalState.questionToUser || "Please clarify.");
                } else if (finalState.finalMessage) {
                  await editInteractionResponse(interactionToken, finalState.finalMessage);
                  await prisma.discordSession.update({
                    where: { discordId: discordUserId }, data: { state: "IDLE", context: {} }
                  });
                }
              }
              return;
            }

            if (state === "AWAITING_NOTES") {
              if (text.toLowerCase() !== "skip") context.notes = text;
              await prisma.discordSession.update({
                where: { discordId: discordUserId }, data: { state: "AWAITING_TAGS", context }
              });

              const components = [{
                type: 1,
                components: [
                  { type: 2, style: 1, label: "⏭️ Skip Tags", custom_id: "skip_tags" }
                ]
              }];
              await editInteractionResponse(interactionToken, `🏷️ Would you like to add **Tags**? (Reply via \`/chat [tags]\` or click Skip)`, components);
              return;
            }

            if (state === "AWAITING_TAGS") {
              if (text.toLowerCase() !== "skip") {
                const tagNames = text.split(",").map((t: string) => t.trim()).filter(Boolean);
                context.tagIds = await ensureTags(workspaceId, userSettings.userId, tagNames);
              }
              await prisma.discordSession.update({
                where: { discordId: discordUserId }, data: { state: "AWAITING_SPLITS", context }
              });

              const components = [{
                type: 1,
                components: [
                  { type: 2, style: 1, label: "⏭️ Skip Splits", custom_id: "skip_splits" }
                ]
              }];
              await editInteractionResponse(interactionToken, `✂️ Would you like to **Split** this across other categories? (Reply via \`/chat [splits]\` or click Skip)`, components);
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
              
              await prisma.discordSession.update({
                where: { discordId: discordUserId }, data: { state: "IDLE", context: {} }
              });

              const typeEmoji = context.type === "income" ? "📈" : "📉";
              await editInteractionResponse(interactionToken, `🎉 **Done!** Transaction fully saved. ${typeEmoji}`);
              return;
            }

            // Fallback for IDLE chat
            if (state === "IDLE") {
              const responseText = await ChatWithAIHeadless(userSettings.userId, text, []);
              await editInteractionResponse(interactionToken, responseText);
            }
          } catch (e) {
            await editInteractionResponse(interactionToken, "❌ An error occurred.");
          }
        })();

        return NextResponse.json({ type: 5 });
      }
    }

    // Handles Interactive Buttons (Type 3)
    if (body.type === 3) {
      const customId = body.data.custom_id;

      const userSettings = await prisma.userSettings.findUnique({ where: { discordUserId } });
      if (!userSettings) return NextResponse.json({ type: 4, data: { content: "❌ Account not linked." } });

      const membership = await prisma.workspaceMember.findFirst({ where: { userId: userSettings.userId, deletedAt: null } });
      if (!membership) return NextResponse.json({ type: 4, data: { content: "❌ No active workspace." } });
      const workspaceId = membership.workspaceId;

      let session = await prisma.discordSession.findUnique({ where: { discordId: discordUserId } });
      if (!session) {
        session = await prisma.discordSession.create({
          data: { discordId: discordUserId, userId: userSettings.userId, state: "IDLE", context: {} }
        });
      }

      if (customId === "skip_notes") {
        const context = (session.context || {}) as any;
        await prisma.discordSession.update({
          where: { discordId: discordUserId },
          data: { state: "AWAITING_TAGS", context }
        });

        const components = [{
          type: 1,
          components: [
            { type: 2, style: 1, label: "⏭️ Skip Tags", custom_id: "skip_tags" }
          ]
        }];

        return NextResponse.json({
          type: 7, // UPDATE_MESSAGE
          data: {
            content: `🏷️ Would you like to add **Tags**? (Reply via \`/chat [tags]\` or click Skip)`,
            components
          }
        });
      }

      if (customId === "skip_tags") {
        const context = (session.context || {}) as any;
        await prisma.discordSession.update({
          where: { discordId: discordUserId },
          data: { state: "AWAITING_SPLITS", context }
        });

        const components = [{
          type: 1,
          components: [
            { type: 2, style: 1, label: "⏭️ Skip Splits", custom_id: "skip_splits" }
          ]
        }];

        return NextResponse.json({
          type: 7,
          data: {
            content: `✂️ Would you like to **Split** this across other categories? (Reply via \`/chat [splits]\` or click Skip)`,
            components
          }
        });
      }

      if (customId === "skip_splits") {
        const context = (session.context || {}) as any;
        await saveDraftTransaction(userSettings.userId, workspaceId, context);
        
        await prisma.discordSession.update({
          where: { discordId: discordUserId },
          data: { state: "IDLE", context: {} }
        });

        const typeEmoji = context.type === "income" ? "📈" : "📉";
        return NextResponse.json({
          type: 7,
          data: {
            content: `🎉 **Done!** Transaction fully saved. ${typeEmoji}`,
            components: []
          }
        });
      }

      if (customId === "skip") {
        return NextResponse.json({
          type: 7,
          data: { content: "✅ Saved successfully! No extra details added.", components: [] }
        });
      }

      if (customId === "add_notes" || customId === "add_tags") {
        const title = customId === "add_notes" ? "Add Notes" : "Add Tags (comma separated)";
        return NextResponse.json({
          type: 9, // MODAL
          data: {
            custom_id: `modal_${customId}`,
            title: title,
            components: [{
              type: 1,
              components: [{
                type: 4,
                custom_id: "input_value",
                label: title,
                style: 2,
                required: true
              }]
            }]
          }
        });
      }
    }

    // Modal Submit (Type 5)
    if (body.type === 5) {
      const customId = body.data.custom_id;
      const value = body.data.components[0].components[0].value;
      const userSettings = await prisma.userSettings.findUnique({ where: { discordUserId }});
      
      if (userSettings) {
        const latestTx = await prisma.transaction.findFirst({
          where: { userId: userSettings.userId },
          orderBy: { createdAt: 'desc' }
        });
        
        if (latestTx) {
          if (customId === "modal_add_notes") {
            await prisma.transaction.update({ where: { id: latestTx.id }, data: { notes: value }});
          } else if (customId === "modal_add_tags") {
            const tags = value.split(",").map((t: string) => t.trim()).filter(Boolean);
            await prisma.transaction.update({ where: { id: latestTx.id }, data: { notes: `Tags: ${tags.join(", ")}` }});
          }
        }
      }

      return NextResponse.json({
        type: 4,
        data: { content: `✅ Updated successfully! You entered: "${value}"`, flags: 64 }
      });
    }

    return NextResponse.json({ error: "Unknown interaction type" }, { status: 400 });
  } catch (error) {
    console.error("Discord Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
