import { Client } from "@notionhq/client";
import prisma from "@/lib/prisma";

export async function syncTransactionToNotion(transactionId: string) {
  try {
    // 1. Fetch the full transaction with its associated user settings
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) return;

    const userSettings = await prisma.userSettings.findUnique({
      where: { userId: transaction.userId },
    });

    // 2. Check if the user has Notion linked
    if (!userSettings?.notionApiKey || !userSettings?.notionDatabaseId) {
      return; // Notion not linked, silently skip
    }

    // 3. Initialize their personal Notion client
    const notion = new Client({ auth: userSettings.notionApiKey });

    // 4. Send the data to their Database
    await notion.pages.create({
      parent: { database_id: userSettings.notionDatabaseId },
      properties: {
        // "Title" property in Notion (usually named 'Name' or 'Description')
        Name: {
          title: [
            {
              text: {
                content: transaction.description || transaction.category,
              },
            },
          ],
        },
        // Amount as a Number property
        Amount: {
          number: transaction.amount,
        },
        // Category as a Select property
        Category: {
          select: {
            name: transaction.category,
          },
        },
        // Type as a Select property (expense, income, investment)
        Type: {
          select: {
            name: transaction.type,
          },
        },
        // Date as a Date property
        Date: {
          date: {
            start: transaction.date.toISOString().split("T")[0],
          },
        },
      },
    });

    console.log(`✅ Synced transaction ${transactionId} to Notion for user ${transaction.userId}`);
  } catch (error) {
    console.error("❌ Failed to sync transaction to Notion:", error);
  }
}
