import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { z } from "zod";

export async function GET(request: Request) {
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const querySchema = z.object({
    from: z.string(),
    to: z.string(),
  });

  const queryParams = querySchema.safeParse({ from, to });

  if (!queryParams.success) {
    return Response.json(queryParams.error, { status: 400 });
  }

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: user.id,
      date: {
        gte: new Date(queryParams.data.from),
        lte: new Date(queryParams.data.to),
      },
    },
    select: {
      date: true,
      amount: true,
      type: true,
    },
  });

  // Group by day of week and hour
  const heatmapData: { [key: string]: { [key: string]: number } } = {};

  transactions.forEach((transaction) => {
    const date = new Date(transaction.date);
    const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "short" });
    const hour = date.getHours();
    const key = `${dayOfWeek}`;

    if (!heatmapData[key]) {
      heatmapData[key] = {};
    }

    if (!heatmapData[key][hour]) {
      heatmapData[key][hour] = 0;
    }

    heatmapData[key][hour] +=
      transaction.type === "expense" ? transaction.amount : 0;
  });

  // Convert to array format for easier visualization
  const daysOrder = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const heatmapArray = daysOrder.map((day) => {
    const dayData: any = { day };
    for (let hour = 0; hour < 24; hour++) {
      dayData[`h${hour}`] = heatmapData[day]?.[hour] || 0;
    }
    return dayData;
  });

  return Response.json(heatmapArray);
}
