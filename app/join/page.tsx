"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { AcceptInvite } from "@/app/(dashboard)/_actions/workspaces";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, Users } from "lucide-react";

function JoinContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");

    const [status, setStatus] = useState<"loading" | "success" | "error" | "no-token">("loading");
    const [message, setMessage] = useState("");
    const [workspaceName, setWorkspaceName] = useState("");

    useEffect(() => {
        if (!token) {
            setStatus("no-token");
            return;
        }

        AcceptInvite(token)
            .then((result) => {
                setStatus("success");
                if (result.alreadyMember) {
                    setMessage("You're already a member of this workspace!");
                } else {
                    setMessage(`You've joined "${result.workspaceName || "the workspace"}" successfully!`);
                    setWorkspaceName(result.workspaceName || "");
                }
            })
            .catch((error) => {
                setStatus("error");
                setMessage(error.message || "Failed to accept invite");
            });
    }, [token]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
            <Card className="w-full max-w-md border border-border bg-card/80 backdrop-blur-xl shadow-2xl">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Users className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">
                        {status === "loading" && "Joining Workspace..."}
                        {status === "success" && "Welcome! 🎉"}
                        {status === "error" && "Something went wrong"}
                        {status === "no-token" && "Invalid Link"}
                    </CardTitle>
                    <CardDescription>
                        {status === "loading" && "Please wait while we process your invitation."}
                        {status === "no-token" && "This invite link appears to be invalid or expired."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                    {status === "loading" && (
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    )}

                    {status === "success" && (
                        <>
                            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                            <p className="text-center text-muted-foreground">{message}</p>
                            <Button
                                className="w-full mt-2"
                                onClick={() => router.push("/dashboard")}
                            >
                                Go to Dashboard
                            </Button>
                        </>
                    )}

                    {status === "error" && (
                        <>
                            <XCircle className="h-12 w-12 text-destructive" />
                            <p className="text-center text-muted-foreground">{message}</p>
                            <Button
                                variant="outline"
                                className="w-full mt-2"
                                onClick={() => router.push("/dashboard")}
                            >
                                Go to Dashboard
                            </Button>
                        </>
                    )}

                    {status === "no-token" && (
                        <Button
                            variant="outline"
                            className="w-full mt-2"
                            onClick={() => router.push("/dashboard")}
                        >
                            Go to Dashboard
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default function JoinPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            }
        >
            <JoinContent />
        </Suspense>
    );
}
