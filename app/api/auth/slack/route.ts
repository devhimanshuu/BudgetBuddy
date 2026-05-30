import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID;
  if (!SLACK_CLIENT_ID) {
    return NextResponse.json({ error: "SLACK_CLIENT_ID is not configured" }, { status: 500 });
  }

  // Define the scopes our bot needs
  const scopes = [
    "chat:write",
    "im:history",
    "im:write",
    "files:read"
  ].join(",");

  // Use the origin from the request URL to build the redirect_uri dynamically (helps with localhost/ngrok/vercel)
  const url = new URL(req.url);
  const redirectUri = `${url.origin}/api/auth/slack/callback`;

  const authUrl = `https://slack.com/oauth/v2/authorize?client_id=${SLACK_CLIENT_ID}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}`;

  return NextResponse.redirect(authUrl);
}
