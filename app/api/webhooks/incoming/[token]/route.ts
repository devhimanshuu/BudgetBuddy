import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import Groq from "groq-sdk";
import { ExtractReceiptData } from "@/app/(dashboard)/_actions/extractReceipt";

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

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  let userId: string = "";
  let parsedBody: any = null;

  try {
    const { token } = await params;
    let actualToken = token;

    // Support Bearer auth if path token is generic
    if (token === "auth") {
      const authHeader = req.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        actualToken = authHeader.split(" ")[1];
      }
    }

    if (!actualToken) {
      return NextResponse.json({ error: "Missing webhook token" }, { status: 401 });
    }

    // 1. Verify User
    const userSettings = await prisma.userSettings.findUnique({
      where: { webhookToken: actualToken }
    });

    if (!userSettings) {
      return NextResponse.json({ error: "Invalid webhook token" }, { status: 401 });
    }

    userId = userSettings.userId;

    // Get Active Workspace
    const membership = await prisma.workspaceMember.findFirst({
      where: { userId, deletedAt: null }
    });
    
    if (!membership) {
      return NextResponse.json({ error: "No active workspace found" }, { status: 400 });
    }
    const workspaceId = membership.workspaceId;

    // 2. Parse Payload
    const body = await req.json();
    if (!body || typeof body !== 'object') {
      throw new Error("Invalid JSON payload. Expected an object.");
    }
    parsedBody = body;

    let draft: any = { type: "expense", category: "Other", amount: 0, description: "" };

    // Mode A: Vision
    if (body.imageUrl) {
      if (typeof body.imageUrl !== 'string' || (!body.imageUrl.startsWith("https://") && !body.imageUrl.startsWith("http://"))) {
        throw new Error("Invalid image URL. Must be a valid HTTP/HTTPS string.");
      }

      try {
        const imgRes = await fetch(body.imageUrl);
        if (!imgRes.ok) throw new Error("Failed to fetch image from URL");
        
        // Prevent DoS: Max 5MB image
        const contentLength = imgRes.headers.get("content-length");
        if (contentLength && parseInt(contentLength) > 5 * 1024 * 1024) {
          throw new Error("Image too large. Maximum size is 5MB.");
        }
        
        const arrayBuffer = await imgRes.arrayBuffer();
        // Fallback size check if content-length was missing
        if (arrayBuffer.byteLength > 5 * 1024 * 1024) {
          throw new Error("Image too large. Maximum size is 5MB.");
        }
        
        const buffer = Buffer.from(arrayBuffer);
        const base64 = `data:${imgRes.headers.get('content-type') || 'image/jpeg'};base64,${buffer.toString("base64")}`;
        
        const extraction = await ExtractReceiptData(base64);
        if (extraction.success && extraction.data) {
          draft.amount = extraction.data.amount || 0;
          draft.category = extraction.data.category || "Food";
          draft.description = extraction.data.merchant || "Receipt";
        } else {
          throw new Error("Failed to extract receipt");
        }
      } catch (e: any) {
        await logWebhook(userId, "ERROR", body || {}, { error: e.message || "Vision extraction failed" });
        return NextResponse.json({ error: "Vision extraction failed" }, { status: 400 });
      }
    }
    // Mode B: Natural Language
    else if (body.text) {
      const groqApiKey = process.env.GROQ_API_KEY;
      if (!groqApiKey) {
        return NextResponse.json({ error: "Groq API key missing" }, { status: 500 });
      }
      const groq = new Groq({ apiKey: groqApiKey });
      const prompt = `Extract transaction details from this text: "${body.text}".
Return JSON ONLY with:
- amount (number)
- category (string)
- type ("expense" or "income")
- notes (string)`;

      try {
        const completion = await groq.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: "llama-3.3-70b-versatile",
          temperature: 0.1,
          response_format: { type: "json_object" }
        });
        const content = completion.choices[0].message.content || "{}";
        const parsed = JSON.parse(content);
        draft.amount = parsed.amount || 0;
        draft.category = parsed.category || "Other";
        draft.type = parsed.type || "expense";
        draft.description = parsed.notes || body.text;
      } catch (e: any) {
        await logWebhook(userId, "ERROR", body, { error: "Failed to parse AI response" });
        return NextResponse.json({ error: "Failed to parse text" }, { status: 400 });
      }
    }
    // Mode C: Structured
    else {
      if (body.amount == null || typeof body.amount === 'boolean' || typeof body.amount === 'object' || String(body.amount).trim() === '' || isNaN(Number(body.amount))) {
         await logWebhook(userId, "ERROR", body || {}, { error: "Missing or invalid amount" });
         return NextResponse.json({ error: "Missing or invalid amount" }, { status: 400 });
      }
      draft.amount = Number(body.amount);
      draft.category = body.category ? String(body.category) : "Other";
      draft.type = body.type ? String(body.type) : "expense";
      draft.description = body.description ? String(body.description) : "Webhook Transaction";
    }

    // Sanitize input
    draft.amount = Math.abs(draft.amount); // Ensure positive amount
    draft.category = draft.category.substring(0, 30); // Prevent UI overflow (30 char max)
    draft.description = draft.description.substring(0, 255); // Prevent UI overflow (255 char max)
    draft.type = draft.type.toLowerCase();
    if (!["expense", "income", "investment"].includes(draft.type)) {
      draft.type = "expense";
    }

    // Ensure Category
    const categoryRecord = await ensureCategory(workspaceId, userId, draft.category, draft.type);
    
    const date = new Date();
    
    // Save Transaction
    const createdTx = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          userId,
          workspaceId,
          amount: draft.amount,
          description: draft.description,
          date,
          type: draft.type,
          category: draft.category,
          categoryIcon: categoryRecord.icon,
          status: "APPROVED"
        }
      });

      // Aggregates
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

    await logWebhook(userId, "SUCCESS", body, createdTx);
    return NextResponse.json({ success: true, transaction: createdTx });

  } catch (error: any) {
    console.error("Webhook Error:", error);
    if (userId) {
      await logWebhook(userId, "ERROR", parsedBody || {}, { error: error.message || "Internal Server Error" });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function logWebhook(userId: string, status: string, payload: any, response: any) {
  try {
    await prisma.webhookLog.create({
      data: {
        userId,
        status,
        payload,
        response
      }
    });
  } catch(e) {
    console.error("Failed to log webhook", e);
  }
}
