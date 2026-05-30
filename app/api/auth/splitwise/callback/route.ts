import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  
  if (!code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/manage?error=MissingCode`);
  }

  const user = await currentUser();
  if (!user) {
    // If user is not logged in, they can't link
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/sign-in`);
  }

  try {
    // Exchange code for token
    const tokenResponse = await fetch("https://secure.splitwise.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.SPLITWISE_CLIENT_ID!,
        client_secret: process.env.SPLITWISE_CLIENT_SECRET!,
        grant_type: "authorization_code",
        code: code,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/splitwise/callback`,
      }),
    });

    const data = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Splitwise OAuth Error:", data);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/manage?error=OAuthFailed`);
    }

    // Save token to DB (use upsert to prevent P2025 if user settings don't exist yet)
    await prisma.userSettings.upsert({
      where: { userId: user.id },
      update: { splitwiseToken: data.access_token },
      create: {
        userId: user.id,
        splitwiseToken: data.access_token,
        currency: "USD",
      }
    });

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/manage?splitwise=success`);
  } catch (error) {
    console.error("Failed to link Splitwise:", error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/manage?error=ServerException`);
  }
}
