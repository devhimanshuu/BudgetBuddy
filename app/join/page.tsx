"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { AcceptInvite } from "@/app/(dashboard)/_actions/workspaces";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, Users } from "lucide-react";
import { useAuth } from "@clerk/nextjs";

function JoinContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");
    const { isLoaded, isSignedIn } = useAuth();

    const [status, setStatus] = useState<"loading" | "success" | "error" | "no-token" | "unauthenticated">("loading");
    const [message, setMessage] = useState("");
    const [workspaceName, setWorkspaceName] = useState("");

    useEffect(() => {
        if (!isLoaded) return;

        if (!token) {
            setStatus("no-token");
            return;
        }

        if (!isSignedIn) {
            setStatus("unauthenticated");
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
    }, [token, isLoaded, isSignedIn]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
            <Card className="w-full max-w-md border border-border bg-card/80 backdrop-blur-xl shadow-2xl">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Users className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">
                        {status === "loading" && "Joining Workspace..."}
                        {status === "unauthenticated" && "Sign In Required"}
                        {status === "success" && "Welcome! 🎉"}
                        {status === "error" && "Something went wrong"}
                        {status === "no-token" && "Invalid Link"}
                    </CardTitle>
                    <CardDescription>
                        {status === "loading" && "Please wait while we process your invitation."}
                        {status === "unauthenticated" && "You need to have an account to join this workspace."}
                        {status === "no-token" && "This invite link appears to be invalid or expired."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                    {status === "loading" && (
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    )}

                    {status === "unauthenticated" && (
                        <div className="flex w-full gap-3 mt-4">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => router.push(`/sign-in?redirect_url=/join?token=${token}`)}
                            >
                                Log In
                            </Button>
                            <Button
                                className="flex-1"
                                onClick={() => router.push(`/sign-up?redirect_url=/join?token=${token}`)}
                            >
                                Register
                            </Button>
                        </div>
                    )}

                    {status === "success" && (
                        <>
                            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                            <p className="text-center text-muted-foreground">{message}</p>
                            <Button
                                className="w-full mt-2"
                                onClick={() => window.location.href = "/dashboard"}
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
