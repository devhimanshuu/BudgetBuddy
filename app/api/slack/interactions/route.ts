import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { syncTransactionToNotion } from "@/lib/notion";

const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET || "";

// Verify Slack Request Signature
async function verifySlackRequest(req: Request, rawBody: string) {
  if (!SLACK_SIGNING_SECRET) return true;

  const signature = req.headers.get("x-slack-signature");
  const timestamp = req.headers.get("x-slack-request-timestamp");

  if (!signature || !timestamp) return false;
  if (Math.abs(Date.now() / 1000 - parseInt(timestamp, 10)) > 60 * 5) return false;

  const sigBaseString = `v0:${timestamp}:${rawBody}`;
  const mySignature = "v0=" + crypto.createHmac("sha256", SLACK_SIGNING_SECRET).update(sigBaseString).digest("hex");

  return crypto.timingSafeEqual(Buffer.from(mySignature), Buffer.from(signature));
}

// Update original message
async function updateSlackMessage(token: string, channel: string, ts: string, text: string) {
  await fetch("https://slack.com/api/chat.update", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ channel, ts, text, blocks: [] }), // Remove blocks to clear buttons
  });
}

// Send Slack Message
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

// Open Modal
async function openSlackModal(token: string, trigger_id: string, custom_id: string, title: string, inputLabel: string, private_metadata: string) {
  await fetch("https://slack.com/api/views.open", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      trigger_id,
      view: {
        type: "modal",
        callback_id: custom_id,
        private_metadata: private_metadata,
        title: { type: "plain_text", text: title },
        submit: { type: "plain_text", text: "Save" },
        close: { type: "plain_text", text: "Cancel" },
        blocks: [
          {
            type: "input",
            block_id: "input_block",
            element: {
              type: "plain_text_input",
              action_id: "input_value",
              multiline: custom_id === "modal_add_notes"
            },
            label: { type: "plain_text", text: inputLabel }
          }
        ]
      }
    }),
  });
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const isValid = await verifySlackRequest(req, rawBody);
    if (!isValid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const searchParams = new URLSearchParams(rawBody);
    const payloadStr = searchParams.get("payload");
    if (!payloadStr) return NextResponse.json({ error: "Missing payload" }, { status: 400 });

    const payload = JSON.parse(payloadStr);
    const teamId = payload.team?.id;

    if (!teamId) return NextResponse.json({ error: "Missing team id" }, { status: 400 });

    const installation = await prisma.slackInstallation.findUnique({ where: { teamId } });
    if (!installation) return NextResponse.json({ error: "Installation not found" }, { status: 404 });
    const botToken = installation.botToken;

    // 1. Block Actions (Buttons)
    if (payload.type === "block_actions") {
      const action = payload.actions[0];
      const channelId = payload.channel.id;
      const messageTs = payload.message.ts;
      const slackUserId = payload.user.id;

      if (action.action_id === "skip") {
        await updateSlackMessage(botToken, channelId, messageTs, "✅ Saved successfully! No extra details added.");
        return NextResponse.json({ ok: true });
      }

      const userSettings = await prisma.userSettings.findUnique({ where: { slackUserId } });
      if (!userSettings) return NextResponse.json({ error: "User not found" }, { status: 404 });
      const membership = await prisma.workspaceMember.findFirst({ where: { userId: userSettings.userId, deletedAt: null } });
      if (!membership) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
      const workspaceId = membership.workspaceId;

      let session = await prisma.slackSession.findUnique({ where: { slackId: slackUserId } });
      if (!session) {
        session = await prisma.slackSession.create({
          data: { slackId: slackUserId, userId: userSettings.userId, state: "IDLE", context: {} }
        });
      }

      if (action.action_id === "skip_notes") {
        const context = (session.context || {}) as any;
        await prisma.slackSession.update({
          where: { slackId: slackUserId },
          data: { state: "AWAITING_TAGS", context }
        });
        await updateSlackMessage(botToken, channelId, messageTs, `✅ Drafted: *${userSettings.currency} ${context.amount}* for *${context.category}*.\n(Notes skipped)`);
        
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
        return NextResponse.json({ ok: true });
      }

      if (action.action_id === "skip_tags") {
        const context = (session.context || {}) as any;
        await prisma.slackSession.update({
          where: { slackId: slackUserId },
          data: { state: "AWAITING_SPLITS", context }
        });
        await updateSlackMessage(botToken, channelId, messageTs, `🏷️ Tags skipped.`);

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
        return NextResponse.json({ ok: true });
      }

      if (action.action_id === "skip_splits") {
        const context = (session.context || {}) as any;
        await saveDraftTransaction(userSettings.userId, workspaceId, context);
        
        await prisma.slackSession.update({
          where: { slackId: slackUserId },
          data: { state: "IDLE", context: {} }
        });
        await updateSlackMessage(botToken, channelId, messageTs, `✂️ Splits skipped.`);

        const typeEmoji = context.type === "income" ? "📈" : "📉";
        await sendSlackMessage(botToken, channelId, `🎉 **Done!** Transaction fully saved. ${typeEmoji}`);
        return NextResponse.json({ ok: true });
      }

      if (action.action_id === "add_notes" || action.action_id === "add_tags") {
        const title = action.action_id === "add_notes" ? "Add Notes" : "Add Tags";
        const label = action.action_id === "add_notes" ? "Notes" : "Comma separated tags";
        
        await openSlackModal(botToken, payload.trigger_id, `modal_${action.action_id}`, title, label, action.value);
        await updateSlackMessage(botToken, channelId, messageTs, "⏳ Opening modal...");
        return NextResponse.json({ ok: true });
      }
    }

    // 2. View Submission (Modal Submit)
    if (payload.type === "view_submission") {
      const callbackId = payload.view.callback_id;
      const transactionId = payload.view.private_metadata;
      
      const values = payload.view.state.values.input_block.input_value.value;

      if (callbackId === "modal_add_notes") {
        await prisma.transaction.update({
          where: { id: transactionId },
          data: { notes: values }
        });
      } else if (callbackId === "modal_add_tags") {
        const tags = values.split(",").map((t: string) => t.trim()).filter(Boolean);
        await prisma.transaction.update({
          where: { id: transactionId },
          data: { notes: `Tags: ${tags.join(", ")}` }
        });
      }

      return new NextResponse(null, { status: 200 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Slack Interaction Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
