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
  const year = searchParams.get("year");

  const querySchema = z.object({
    year: z.string(),
  });

  const queryParams = querySchema.safeParse({ year });

  if (!queryParams.success) {
    return Response.json(queryParams.error, { status: 400 });
  }

  const currentYear = parseInt(queryParams.data.year);
  const previousYear = currentYear - 1;

  // Get current year data
  const currentYearData = await prisma.yearHistory.findMany({
    where: {
      userId: user.id,
      year: currentYear,
    },
    orderBy: {
      month: "asc",
    },
  });

  // Get previous year data
  const previousYearData = await prisma.yearHistory.findMany({
    where: {
      userId: user.id,
      year: previousYear,
    },
    orderBy: {
      month: "asc",
    },
  });

  // Create comparison data
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const comparison = monthNames.map((monthName, index) => {
    const currentMonth = currentYearData.find((d) => d.month === index);
    const previousMonth = previousYearData.find((d) => d.month === index);

    return {
      month: monthName,
      currentYearIncome: currentMonth?.income || 0,
      currentYearExpense: currentMonth?.expense || 0,
      previousYearIncome: previousMonth?.income || 0,
      previousYearExpense: previousMonth?.expense || 0,
      currentYearBalance:
        (currentMonth?.income || 0) - (currentMonth?.expense || 0),
      previousYearBalance:
        (previousMonth?.income || 0) - (previousMonth?.expense || 0),
    };
  });

  return Response.json(comparison);
}
