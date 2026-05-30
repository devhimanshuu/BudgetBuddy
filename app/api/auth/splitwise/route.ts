import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.SPLITWISE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Missing Splitwise Client ID" }, { status: 500 });
  }

  // Redirect to Splitwise OAuth 2.0 authorization page
  const redirectUri = encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/splitwise/callback`);
  const authUrl = `https://secure.splitwise.com/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}`;
  
  return NextResponse.redirect(authUrl);
}
