import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.redirect(new URL("/sign-in?redirect_url=/manage", req.url));
    }

    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");

    if (error) {
      console.error("Slack OAuth Error:", error);
      return NextResponse.redirect(new URL("/manage?slack=error", req.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL("/manage?slack=error", req.url));
    }

    const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID;
    const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET;
    const redirectUri = `${url.origin}/api/auth/slack/callback`;

    // Exchange code for token
    const formData = new URLSearchParams();
    formData.append("client_id", SLACK_CLIENT_ID!);
    formData.append("client_secret", SLACK_CLIENT_SECRET!);
    formData.append("code", code);
    formData.append("redirect_uri", redirectUri);

    const tokenRes = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString()
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.ok) {
      console.error("Slack token exchange failed:", tokenData.error);
      return NextResponse.redirect(new URL("/manage?slack=error", req.url));
    }

    // Save to database
    // tokenData shape: { ok: true, access_token: "xoxb-...", team: { id: "T123", name: "My Team" }, bot_user_id: "U123", authed_user: { id: "U456" } }
    
    await prisma.slackInstallation.upsert({
      where: { teamId: tokenData.team.id },
      update: {
        botToken: tokenData.access_token,
        teamName: tokenData.team.name,
        botUserId: tokenData.bot_user_id,
        userId: user.id
      },
      create: {
        teamId: tokenData.team.id,
        botToken: tokenData.access_token,
        teamName: tokenData.team.name,
        botUserId: tokenData.bot_user_id,
        userId: user.id
      }
    });

    // Link the current user's BudgetBuddy account to their Slack identity
    await prisma.userSettings.upsert({
      where: { userId: user.id },
      update: { slackUserId: tokenData.authed_user.id },
      create: {
        userId: user.id,
        currency: "USD",
        slackUserId: tokenData.authed_user.id
      }
    });

    return NextResponse.redirect(new URL("/manage?slack=success", req.url));
  } catch (error) {
    console.error("Slack Callback Error:", error);
    return NextResponse.redirect(new URL("/manage?slack=error", req.url));
  }
}
