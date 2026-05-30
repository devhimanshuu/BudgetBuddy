import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userSettings = await prisma.userSettings.findUnique({
    where: { userId: user.id },
  });

  if (!userSettings?.splitwiseToken) {
    return NextResponse.json({ error: "Splitwise not connected" }, { status: 400 });
  }

  try {
    const response = await fetch("https://secure.splitwise.com/api/v3.0/get_friends", {
      headers: {
        "Authorization": `Bearer ${userSettings.splitwiseToken}`
      }
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch friends from Splitwise" }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Splitwise get_friends error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
