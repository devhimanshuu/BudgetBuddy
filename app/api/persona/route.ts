import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getPersona } from "@/lib/persona";
import { getActiveWorkspace } from "@/lib/workspaces";

export async function GET() {
    const user = await currentUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const workspace = await getActiveWorkspace(user.id);
        const personaData = await getPersona(user.id, workspace?.id);
        return NextResponse.json(personaData);
    } catch (error) {
        console.error("Error fetching persona:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
