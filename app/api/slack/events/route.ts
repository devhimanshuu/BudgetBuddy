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

            // Send processing message
            await sendSlackMessage(botToken, channelId, "⏳ Processing...");

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

            // Handle Chatbot Mode
            if (text.toLowerCase().startsWith("chat ")) {
              const chatQuery = text.substring(5).trim();
              const responseText = await ChatWithAIHeadless(userSettings.userId, workspaceId, [{ role: "user", content: chatQuery }]);
              await sendSlackMessage(botToken, channelId, responseText);
              return;
            }

            // File parsing (Voice or Receipts)
            if (event.files && event.files.length > 0) {
              const file = event.files[0];
              if (file.mimetype.startsWith("audio/")) {
                const buffer = await downloadSlackFile(botToken, file.url_private_download);
                // We convert to File object for groq SDK
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
                
                // Dynamic import to avoid edge runtime issues if ExtractReceiptData uses heavy Node libs
                const { ExtractReceiptData } = await import("@/app/(dashboard)/_actions/extractReceipt");
                const extraction = await ExtractReceiptData(base64);
                if (extraction.success && extraction.data) {
                  text = `${extraction.data.amount || 0} for ${extraction.data.category || "Other"}`;
                } else {
                  await sendSlackMessage(botToken, channelId, "❌ I couldn't read the receipt.");
                  return;
                }
              }
            }

            if (!text) {
              await sendSlackMessage(botToken, channelId, "❌ Please provide text, an image, or a voice note.");
              return;
            }

            // Parse Transaction using Groq LLaMA
            const completion = await getGroqClient().chat.completions.create({
              messages: [
                { role: "system", content: `You are an AI that extracts transaction data from text. Output ONLY a JSON object: {"amount": number, "category": string, "type": "expense"|"income"|"investment", "description": string}` },
                { role: "user", content: text }
              ],
              model: "llama3-8b-8192",
              temperature: 0.1,
              response_format: { type: "json_object" }
            });

            const parsedData = JSON.parse(completion.choices[0].message.content || "{}");
            if (!parsedData.amount || !parsedData.category) {
              await sendSlackMessage(botToken, channelId, "❌ I couldn't understand that transaction.");
              return;
            }

            // Create Transaction
            const transaction = await prisma.transaction.create({
              data: {
                userId: userSettings.userId,
                workspaceId,
                amount: parsedData.amount,
                description: parsedData.description || parsedData.category,
                date: new Date(),
                type: parsedData.type || "expense",
                category: parsedData.category,
                categoryIcon: "🏷️",
                status: "APPROVED"
              }
            });

            // Syncs
            try { await syncTransactionToNotion(transaction.id); } catch(e) {}
            try { 
              const splitwiseModule = await import('@/lib/splitwise');
              await splitwiseModule.pushExpenseToSplitwise(transaction.id); 
            } catch(e) {}

            // Send Interactive Block Kit UI
            const blocks = [
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `✅ Logged: *${userSettings.currency} ${parsedData.amount}* for *${parsedData.category}*.\nWould you like to add more details?`
                }
              },
              {
                type: "actions",
                elements: [
                  {
                    type: "button",
                    text: { type: "plain_text", text: "Add Notes" },
                    value: transaction.id,
                    action_id: "add_notes"
                  },
                  {
                    type: "button",
                    text: { type: "plain_text", text: "Add Tags" },
                    value: transaction.id,
                    action_id: "add_tags"
                  },
                  {
                    type: "button",
                    text: { type: "plain_text", text: "Skip" },
                    value: "skip",
                    action_id: "skip",
                    style: "danger"
                  }
                ]
              }
            ];

            await sendSlackMessage(botToken, channelId, "Result:", blocks);

          } catch (error) {
            console.error("Slack Event Error:", error);
            // We can't use botToken here safely if it threw before botToken was initialized, 
            // but for simplicity we'll just log it.
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
