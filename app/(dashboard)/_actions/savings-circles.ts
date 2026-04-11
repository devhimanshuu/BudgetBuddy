"use server";

import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { logActivity } from "@/lib/workspaces";
import { checkAchievements } from "@/lib/gamification";
import { z } from "zod";

export async function ContributeToGoal(goalId: string, amount: number) {
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const goal = await prisma.savingsGoal.findUnique({
    where: { id: goalId },
  });

  if (!goal) {
    throw new Error("Goal not found");
  }

  // Add contribution
  const contribution = await prisma.goalContribution.create({
    data: {
      goalId,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`.trim() || user.username || "Anonymous",
      userImage: user.imageUrl,
      amount,
    },
  });

  const newAmount = goal.currentAmount + amount;
  const isNowCompleted = newAmount >= goal.targetAmount && !goal.isCompleted;

  // Update currentAmount in SavingsGoal
  await prisma.savingsGoal.update({
    where: { id: goalId },
    data: {
      currentAmount: {
        increment: amount,
      },
      isCompleted: isNowCompleted ? true : undefined,
    },
  });

  const userName = user.firstName ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}` : user.username || "Anonymous";

  // Track activity
  if (goal.workspaceId) {
    if (isNowCompleted) {
      await logActivity({
        workspaceId: goal.workspaceId,
        userId: user.id,
        type: "SAVINGS_GOAL_COMPLETED",
        description: `${userName} completed savings goal: ${goal.icon} ${goal.name}! 🎉`,
        metadata: { userName, name: goal.name }
      });
    } else {
      await logActivity({
        workspaceId: goal.workspaceId,
        userId: user.id,
        type: "GOAL_CONTRIBUTION",
        description: `${userName} contributed ${amount} to ${goal.name}`,
        metadata: {
          goalId,
          goalName: goal.name,
          amount,
        },
      });
    }
  }

  // Check achievements if completed
  if (isNowCompleted) {
    await checkAchievements(user.id, {
      type: "savings_goal",
    });
  }

  return { contribution, isNowCompleted };
}

export async function GetGoalSocialData(goalId: string) {
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const contributions = await prisma.goalContribution.findMany({
    where: { goalId },
    orderBy: { createdAt: "desc" },
  });

  const messages = await prisma.goalMessage.findMany({
    where: { goalId },
    orderBy: { createdAt: "asc" },
  });

  // Calculate leaderboard
  const leaderMap = new Map<string, { userId: string; name: string; image: string; total: number }>();
  contributions.forEach((c) => {
    const existing = leaderMap.get(c.userId);
    if (existing) {
      existing.total += c.amount;
    } else {
      leaderMap.set(c.userId, {
        userId: c.userId,
        name: c.userName || "Anonymous",
        image: c.userImage || "",
        total: c.amount,
      });
    }
  });

  const leaderboard = Array.from(leaderMap.values()).sort((a, b) => b.total - a.total);

  return { contributions, messages, leaderboard };
}

export async function SendGoalMessage(goalId: string, content: string) {
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const message = await prisma.goalMessage.create({
    data: {
      goalId,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`.trim() || user.username || "Anonymous",
      userImage: user.imageUrl,
      content,
    },
  });

  return message;
}
