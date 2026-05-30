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

export async function POST(req: Request) {
  try {
    const { isValid, body } = await verifyDiscordRequest(req);
    if (!isValid) return NextResponse.json({ error: "Bad request signature" }, { status: 401 });
    if (body.type === 1) return NextResponse.json({ type: 1 });

    const discordUserId = body.member?.user?.id || body.user?.id;

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
        return NextResponse.json({ type: 4, data: { content: "❌ Your account is not linked. Use `/start` to get your ID." } });
      }

      const membership = await prisma.workspaceMember.findFirst({ where: { userId: userSettings.userId, deletedAt: null } });
      if (!membership) return NextResponse.json({ type: 4, data: { content: "❌ You don't have active workspaces." } });
      const workspaceId = membership.workspaceId;

      if (commandName === "log") {
        const textOption = body.data.options?.find((o: any) => o.name === "text");
        const receiptOption = body.data.options?.find((o: any) => o.name === "receipt");
        const voiceOption = body.data.options?.find((o: any) => o.name === "voice");
        
        let text = textOption ? textOption.value : "";
        const interactionToken = body.token;

        // Process asynchronously
        (async () => {
          try {
            // Feature 1: Receipt Parsing
            if (receiptOption) {
              const attachmentId = receiptOption.value;
              const attachmentObj = body.data.resolved.attachments[attachmentId];
              await editInteractionResponse(interactionToken, "📸 Scanning receipt... please wait.");
              const buffer = await downloadDiscordAttachment(attachmentObj.url);
              const base64 = `data:${attachmentObj.content_type};base64,${buffer.toString("base64")}`;
              const extraction = await ExtractReceiptData(base64);
              if (extraction.success && extraction.data) {
                text = `${extraction.data.amount || 0} for ${extraction.data.category || "Other"}`;
              } else {
                return editInteractionResponse(interactionToken, "❌ I couldn't read the receipt.");
              }
            }

            // Feature 2: Voice Parsing
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

            // Extract Data
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
              return editInteractionResponse(interactionToken, "❌ I couldn't understand that transaction.");
            }

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

            // Await External Syncs
            try {
              await syncTransactionToNotion(transaction.id);
            } catch (error) {
              console.error("Notion Sync Error:", error);
            }
            try {
              const splitwiseModule = await import('@/lib/splitwise');
              await splitwiseModule.pushExpenseToSplitwise(transaction.id);
            } catch (error) {
              console.error("Splitwise Sync Error:", error);
            }

            // Feature 3: Interactive Buttons!
            const components = [{
              type: 1, // Action Row
              components: [
                { type: 2, style: 1, label: "Add Notes", custom_id: "add_notes" },
                { type: 2, style: 1, label: "Add Tags", custom_id: "add_tags" },
                { type: 2, style: 2, label: "Skip", custom_id: "skip" }
              ]
            }];

            await editInteractionResponse(interactionToken, `✅ Logged: **${userSettings.currency} ${parsedData.amount}** for **${parsedData.category}**.\nWould you like to add more details?`, components);
          } catch (e) {
            console.error(e);
            await editInteractionResponse(interactionToken, "❌ An error occurred.");
          }
        })();

        return NextResponse.json({ type: 5 }); // DEFERRED ACK
      }

      if (commandName === "chat") {
        const messageOption = body.data.options?.find((o: any) => o.name === "message");
        const text = messageOption ? messageOption.value : "";
        const interactionToken = body.token;

        (async () => {
          try {
            const responseText = await ChatWithAIHeadless(userSettings.userId, workspaceId, [{ role: "user", content: text }]);
            
            // Feature 4: TTS generation
            const shortText = responseText.substring(0, 200);
            const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(shortText)}&tl=en&client=tw-ob`;
            const res = await fetch(ttsUrl);
            if (res.ok) {
              const audioBuffer = Buffer.from(await res.arrayBuffer());
              await editInteractionResponse(interactionToken, responseText, [], { name: "reply.ogg", buffer: audioBuffer, type: "audio/ogg" });
            } else {
              await editInteractionResponse(interactionToken, responseText);
            }
          } catch (e) {
            await editInteractionResponse(interactionToken, "❌ An error occurred while chatting.");
          }
        })();

        return NextResponse.json({ type: 5 });
      }
    }

    // Feature 5: Interactive Component Handles (Buttons)
    if (body.type === 3) {
      const customId = body.data.custom_id;
      
      if (customId === "skip") {
        return NextResponse.json({
          type: 7, // UPDATE_MESSAGE
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

    // Feature 6: Modal Submit Handle
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
