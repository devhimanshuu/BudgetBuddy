import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import Groq, { toFile } from "groq-sdk";
import { ChatWithAIHeadless } from "@/lib/telegram-ai";
import { ExtractReceiptData } from "@/app/(dashboard)/_actions/extractReceipt";
import { syncTransactionToNotion } from "@/lib/notion";

const getGroqClient = () => new Groq({ apiKey: process.env.GROQ_API_KEY });
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Helper: Send Telegram Message
async function sendMessage(chatId: string | number, text: string, reply_markup?: any) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  const body: any = { chat_id: chatId, text, parse_mode: "Markdown" };
  if (reply_markup) body.reply_markup = reply_markup;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// Helper: Send Voice Note
async function sendVoice(chatId: string | number, buffer: Buffer) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendVoice`;
  const formData = new FormData();
  formData.append("chat_id", chatId.toString());
  formData.append("voice", new Blob([new Uint8Array(buffer)], { type: "audio/ogg" }), "voice.ogg");
  await fetch(url, { method: "POST", body: formData });
}

// Helper: Download File from Telegram
async function getTelegramFileBuffer(fileId: string): Promise<Buffer | null> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getFile?file_id=${fileId}`);
    const data = await res.json();
    if (!data.ok) return null;
    const filePath = data.result.file_path;
    const fileRes = await fetch(`https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${filePath}`);
    const arrayBuffer = await fileRes.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (e) {
    console.error("Failed to fetch telegram file", e);
    return null;
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

// Helper: Save the Transaction manually (replicating CreateTransaction logic)
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
    const body = await req.json();
    const message = body.message || body.edited_message;
    const callbackQuery = body.callback_query;
    if (!message && !callbackQuery) return NextResponse.json({ ok: true });

    const chatId = message ? message.chat.id.toString() : callbackQuery.message.chat.id.toString();
    let text = message ? (message.text || "").trim() : callbackQuery.data;

    // Acknowledge callback query to remove loading state on button
    if (callbackQuery) {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callback_query_id: callbackQuery.id })
      });
    }

    // 1. Verify User
    const userSettings = await prisma.userSettings.findUnique({
      where: { telegramChatId: chatId }
    });

    if (!userSettings) {
      if (text && text.toLowerCase() === "/start") {
        await sendMessage(chatId, `👋 **Welcome to BudgetBuddy Bot!**\n\nTo get started, you need to link your account.\n1. Copy your Chat ID: \`${chatId}\`\n2. Go to BudgetBuddy Web -> Manage -> Telegram Integration\n3. Paste the ID and click Link.`);
        return NextResponse.json({ ok: true });
      }
      await sendMessage(chatId, `Welcome! Your Telegram Chat ID is: \`${chatId}\`\nPlease enter this in BudgetBuddy Settings to link your account.`);
      return NextResponse.json({ ok: true });
    }

    // Get Workspace
    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: userSettings.userId, deletedAt: null }
    });
    if (!membership) {
      await sendMessage(chatId, "❌ You don't have any active workspaces.");
      return NextResponse.json({ ok: true });
    }
    const workspaceId = membership.workspaceId;

    // 2. Get or Create Session
    let session = await prisma.telegramSession.findUnique({ where: { chatId } });
    if (!session) {
      session = await prisma.telegramSession.create({
        data: { chatId, userId: userSettings.userId, state: "IDLE", context: {} }
      });
    }

    // 3. Handle Global Commands
    const helpText = `🤖 **How to use BudgetBuddy Bot**\n\n📝 **Text:** Type "50 for food"\n🎙️ **Voice:** Send a voice note\n📸 **Receipt:** Send a photo of a receipt\n💬 **Chatbot:** Type \`/chatbot\` to talk to your AI advisor\n\nFollow the interactive buttons for notes and tags!`;

    if (text && (text.toLowerCase() === "/start" || text.toLowerCase() === "/help")) {
      await prisma.telegramSession.update({
        where: { chatId }, data: { state: "IDLE", context: {} }
      });
      await sendMessage(chatId, text.toLowerCase() === "/start" ? `✅ **Account Linked!**\n\n${helpText}` : helpText);
      return NextResponse.json({ ok: true });
    }
    if (text && (text.toLowerCase() === "/cancel" || text.toLowerCase() === "/exit")) {
      await prisma.telegramSession.update({
        where: { chatId }, data: { state: "IDLE", context: {} }
      });
      await sendMessage(chatId, "✅ Action cancelled. I am back to normal mode. Send me an expense, or type `/chatbot` to chat.");
      return NextResponse.json({ ok: true });
    }

    if (text && text.toLowerCase() === "/chatbot") {
      await prisma.telegramSession.update({
        where: { chatId }, data: { state: "CHATBOT", context: { history: [] } }
      });
      await sendMessage(chatId, "🤖 **BudgetBuddy AI Chatbot Activated!**\nAsk me anything about your finances. (Type `/exit` to leave)");
      return NextResponse.json({ ok: true });
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

      await prisma.telegramSession.update({
        where: { chatId }, data: { state: "TAX_AUDITOR", context: { sessionId: agentSession.id } }
      });
      await sendMessage(chatId, `🧑‍💼 **Tax Auditor Activated!**\nStarting audit for year ${year}. Let me review your transactions...`);
      
      const graph = createTaxAuditorGraph();
      const finalState: any = await graph.invoke(initialState);
      
      await prisma.agentSession.update({
        where: { id: agentSession.id },
        data: { state: JSON.parse(JSON.stringify(finalState)) }
      });

      if (finalState.awaitingUserInput) {
        await sendMessage(chatId, finalState.questionToUser || "Please clarify.");
      } else if (finalState.reportUrl) {
        // App URL should point to origin. But for local testing, just give the path or placeholder domain
        await sendMessage(chatId, `✅ Audit Complete! Download your Tax Report here:\n\n${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}${finalState.reportUrl}`);
        await prisma.telegramSession.update({
          where: { chatId }, data: { state: "IDLE", context: {} }
        });
      }
      return NextResponse.json({ ok: true });
    }

    if (text && text.toLowerCase() === "/drive") {
      await prisma.telegramSession.update({
        where: { chatId }, data: { state: "DRIVE_MODE", context: { history: [] } }
      });
      const welcomeText = "🚗 Drive Mode Activated! Hands-free. Just send me voice notes and I will reply with voice notes. Say '/exit' to leave.";
      await sendMessage(chatId, welcomeText);
      try {
        const shortText = welcomeText.substring(0, 200);
        const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(shortText)}&tl=en&client=tw-ob`;
        const res = await fetch(ttsUrl);
        if (res.ok) {
          const audioBuffer = Buffer.from(await res.arrayBuffer());
          await sendVoice(chatId, audioBuffer);
        }
      } catch (e) {}
      return NextResponse.json({ ok: true });
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

      await prisma.telegramSession.update({
        where: { chatId }, data: { state: "WEALTH_CHALLENGER", context: { sessionId: agentSession.id } }
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
        await sendMessage(chatId, finalState.questionToUser || "Do you accept this challenge?");
      } else if (finalState.finalMessage) {
        await sendMessage(chatId, finalState.finalMessage);
        await prisma.telegramSession.update({
          where: { chatId }, data: { state: "IDLE", context: {} }
        });
      }
      return NextResponse.json({ ok: true });
    }

    // 4. State Machine
    const state = session.state;
    const context: any = session.context || {};

    // -- Handle Premium Media Inputs --
    if (state === "IDLE" && message && message.photo && message.photo.length > 0) {
      await sendMessage(chatId, "📸 Scanning receipt and looking for splits... please wait.");
      const photo = message.photo[message.photo.length - 1]; // get highest resolution
      const buffer = await getTelegramFileBuffer(photo.file_id);
      if (buffer) {
        const base64 = `data:image/jpeg;base64,${buffer.toString("base64")}`;
        
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
        
        await prisma.telegramSession.update({
          where: { chatId }, data: { state: "RECEIPT_SCANNER", context: { sessionId: agentSession.id } }
        });
        
        const { createReceiptScannerGraph } = await import("@/agent/workflows/receipt-scanner");
        const graph = createReceiptScannerGraph();
        const finalState: any = await graph.invoke(initialState);
        
        await prisma.agentSession.update({
          where: { id: agentSession.id },
          data: { state: JSON.parse(JSON.stringify(finalState)) }
        });

        if (finalState.awaitingUserInput) {
          await sendMessage(chatId, finalState.questionToUser || "Please clarify.");
        } else if (finalState.finalMessage) {
          await sendMessage(chatId, finalState.finalMessage);
          await prisma.telegramSession.update({
            where: { chatId }, data: { state: "IDLE", context: {} }
          });
        }
        return NextResponse.json({ ok: true });
      }
    }

    if (message && message.voice) {
      await sendMessage(chatId, "🎙️ Transcribing voice note... please wait.");
      const buffer = await getTelegramFileBuffer(message.voice.file_id);
      if (buffer) {
        try {
          const file = await toFile(buffer, "audio.ogg", { type: "audio/ogg" });
          const transcription = await getGroqClient().audio.transcriptions.create({
            file: file,
            model: "whisper-large-v3-turbo",
          });
          text = transcription.text.trim();
        } catch (err) {
          console.error("Voice transcription failed", err);
          await sendMessage(chatId, "❌ Sorry, I couldn't transcribe the audio. Please type it out.");
          return NextResponse.json({ ok: true });
        }
      }
    }

    if (!text && state === "IDLE") return NextResponse.json({ ok: true });

    if (state === "CHATBOT") {
      const history = context.history || [];
      const responseText = await ChatWithAIHeadless(userSettings.userId, text, history);
      
      // Update history
      history.push({ role: "user", content: text });
      history.push({ role: "assistant", content: responseText });
      // Keep last 10 messages
      const prunedHistory = history.slice(-10);
      
      await prisma.telegramSession.update({
        where: { chatId }, data: { context: { ...context, history: prunedHistory } }
      });
      
      await sendMessage(chatId, responseText);

      // Feature 5: AI Voice Note Replies
      try {
        // Using Free Google Translate TTS as requested
        const shortText = responseText.substring(0, 200);
        const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(shortText)}&tl=en&client=tw-ob`;
        const res = await fetch(ttsUrl);
        
        if (res.ok) {
          const audioBuffer = Buffer.from(await res.arrayBuffer());
          await sendVoice(chatId, audioBuffer);
        }
      } catch (err) {
        console.error("TTS failed", err);
      }
      
      return NextResponse.json({ ok: true });
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
          await sendMessage(chatId, finalState.questionToUser || "Please clarify.");
        } else if (finalState.reportUrl) {
          await sendMessage(chatId, `✅ Audit Complete! Download your Tax Report here:\n\n${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}${finalState.reportUrl}`);
          await prisma.telegramSession.update({
            where: { chatId }, data: { state: "IDLE", context: {} }
          });
        }
      }
      return NextResponse.json({ ok: true });
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
          await sendMessage(chatId, finalState.questionToUser || "Please clarify.");
        } else if (finalState.finalMessage) {
          await sendMessage(chatId, finalState.finalMessage);
          await prisma.telegramSession.update({
            where: { chatId }, data: { state: "IDLE", context: {} }
          });
        }
      }
      return NextResponse.json({ ok: true });
    }

    if (state === "DRIVE_MODE") {
      const history = context.history || [];
      const responseText = await ChatWithAIHeadless(userSettings.userId, text, history);
      
      history.push({ role: "user", content: text });
      history.push({ role: "assistant", content: responseText });
      const prunedHistory = history.slice(-10);
      
      await prisma.telegramSession.update({
        where: { chatId }, data: { context: { ...context, history: prunedHistory } }
      });
      
      await sendMessage(chatId, responseText);

      try {
        const shortText = responseText.substring(0, 200);
        const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(shortText)}&tl=en&client=tw-ob`;
        const res = await fetch(ttsUrl);
        
        if (res.ok) {
          const audioBuffer = Buffer.from(await res.arrayBuffer());
          await sendVoice(chatId, audioBuffer);
        }
      } catch (err) {
        console.error("TTS failed", err);
      }
      return NextResponse.json({ ok: true });
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
          await sendMessage(chatId, finalState.questionToUser || "Please clarify.");
        } else if (finalState.finalMessage) {
          await sendMessage(chatId, finalState.finalMessage);
          await prisma.telegramSession.update({
            where: { chatId }, data: { state: "IDLE", context: {} }
          });
        }
      }
      return NextResponse.json({ ok: true });
    }

    if (state === "IDLE") {
      // Parse initial transaction
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
        await sendMessage(chatId, "❌ I couldn't understand that. Try `50 for food`.");
        return NextResponse.json({ ok: true });
      }
      
      const parsedData = JSON.parse(jsonMatch[0]);
      if (!parsedData.amount || !parsedData.category || !parsedData.type) {
        // Feature B: Autonomous Investigation Fallback
        const responseText = await ChatWithAIHeadless(userSettings.userId, text, []);
        await sendMessage(chatId, responseText);
        
        if (message && message.voice) {
          try {
            const shortText = responseText.substring(0, 200);
            const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(shortText)}&tl=en&client=tw-ob`;
            const res = await fetch(ttsUrl);
            if (res.ok) {
              const audioBuffer = Buffer.from(await res.arrayBuffer());
              await sendVoice(chatId, audioBuffer);
            }
          } catch (err) {}
        }
        return NextResponse.json({ ok: true });
      }

      // Feature A: Emotional Intelligence (Empathetic Response)
      if (parsedData.empatheticResponse) {
        await sendMessage(chatId, `💡 ${parsedData.empatheticResponse}`);
        if (message && message.voice) {
          try {
            const shortText = parsedData.empatheticResponse.substring(0, 200);
            const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(shortText)}&tl=en&client=tw-ob`;
            const res = await fetch(ttsUrl);
            if (res.ok) {
              const audioBuffer = Buffer.from(await res.arrayBuffer());
              await sendVoice(chatId, audioBuffer);
            }
          } catch (err) {}
        }
      }

      // Ensure dynamic category
      const category = await ensureCategory(workspaceId, userSettings.userId, parsedData.category, parsedData.type);
      parsedData.categoryIcon = category.icon;

      // Save draft and move to AWAITING_NOTES
      await prisma.telegramSession.update({
        where: { chatId },
        data: { state: "AWAITING_NOTES", context: parsedData }
      });

      await sendMessage(chatId, `✅ Drafted: **${userSettings.currency} ${parsedData.amount}** for **${parsedData.category}**.\n\n📝 Would you like to add any **Notes**? (Reply with your note, or tap Skip)`, {
        inline_keyboard: [[{ text: "⏭️ Skip Notes", callback_data: "skip" }]]
      });
      return NextResponse.json({ ok: true });
    }

    if (state === "AWAITING_NOTES") {
      if (text.toLowerCase() !== "skip") context.notes = text;
      await prisma.telegramSession.update({
        where: { chatId }, data: { state: "AWAITING_TAGS", context }
      });
      await sendMessage(chatId, `🏷️ Would you like to add **Tags**? (Reply with tags separated by commas, e.g. "vacation, family", or tap Skip)`, {
        inline_keyboard: [[{ text: "⏭️ Skip Tags", callback_data: "skip" }]]
      });
      return NextResponse.json({ ok: true });
    }

    if (state === "AWAITING_TAGS") {
      if (text.toLowerCase() !== "skip") {
        const tagNames = text.split(",").map((t: string) => t.trim()).filter(Boolean);
        context.tagIds = await ensureTags(workspaceId, userSettings.userId, tagNames);
      }
      await prisma.telegramSession.update({
        where: { chatId }, data: { state: "AWAITING_SPLITS", context }
      });
      await sendMessage(chatId, `✂️ Would you like to **Split** this across other categories? (Reply with amounts and categories, e.g. "10 to Drinks", or tap Skip)`, {
        inline_keyboard: [[{ text: "⏭️ Skip Splits", callback_data: "skip" }]]
      });
      return NextResponse.json({ ok: true });
    }

    if (state === "AWAITING_SPLITS") {
      if (text.toLowerCase() !== "skip") {
        // AI parse splits
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

      // Save Transaction
      await saveDraftTransaction(userSettings.userId, workspaceId, context);
      
      // Reset State
      await prisma.telegramSession.update({
        where: { chatId }, data: { state: "IDLE", context: {} }
      });

      const typeEmoji = context.type === "income" ? "📈" : "📉";
      await sendMessage(chatId, `🎉 **Done!** Transaction fully saved. ${typeEmoji}`);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
