"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Sparkles, HelpCircle } from "lucide-react";
import { UnlinkSlack } from "../_actions/slack";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import SkeletonWrapper from "@/components/SkeletonWrapper";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export function SlackSettingsCard() {
  const [isLinking, setIsLinking] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Handle OAuth Callbacks
  useEffect(() => {
    if (searchParams.get("slack") === "success") {
      toast.success("Slack connected successfully!");
      router.replace("/manage");
    }
    if (searchParams.get("slack") === "error") {
      toast.error("Failed to connect Slack. Please try again.");
      router.replace("/manage");
    }
  }, [searchParams, router]);

  // Fetch user settings to see if already linked
  const userSettingsQuery = useQuery({
    queryKey: ["userSettings"],
    queryFn: () => fetch("/api/user-settings").then((res) => res.json()),
  });

  const isLinked = !!userSettingsQuery.data?.slackUserId;

  const handleLink = () => {
    window.location.href = "/api/auth/slack";
  };

  const handleUnlink = async () => {
    setIsLinking(true);
    try {
      await UnlinkSlack();
      toast.success("Slack account unlinked");
      userSettingsQuery.refetch();
    } catch (error: any) {
      toast.error("Failed to unlink account");
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <SkeletonWrapper isLoading={userSettingsQuery.isLoading}>
      <Card className="border-primary/20 bg-gradient-to-br from-card to-purple-500/5 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-[#4A154B]">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.523-2.522v-2.522h2.523zM15.165 17.688a2.527 2.527 0 0 1-2.523-2.523 2.526 2.526 0 0 1 2.523-2.52h6.312A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
              </svg>
              Slack Integration
            </div>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1 text-muted-foreground hover:text-foreground">
                  <HelpCircle className="w-4 h-4" />
                  How to setup
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>How to connect Slack</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-sm mt-4">
                  <div className="space-y-1">
                    <h4 className="font-semibold flex items-center gap-2 text-foreground">1. Add to Slack</h4>
                    <p className="text-muted-foreground">Click the <strong>Add to Slack</strong> button to authenticate BudgetBuddy in your Slack workspace.</p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-semibold flex items-center gap-2 text-foreground">2. Message the Bot</h4>
                    <p className="text-muted-foreground">Go to your Slack workspace, search for BudgetBuddy in the Apps section, and send it a direct message like <strong>&quot;50 for lunch&quot;</strong>!</p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-semibold flex items-center gap-2 text-foreground">3. Agentic Workflows</h4>
                    <p className="text-muted-foreground">You can upload receipts, send Voice Notes (Drive Mode), or trigger the Tax Audit and Wealth Challenge agents right from your Slack DM!</p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
          <CardDescription>
            Talk to BudgetBuddy directly from your Slack workspace. Add expenses and chat with your AI persona.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isLinked ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Connect your Slack workspace to allow BudgetBuddy to log your expenses via direct message.
              </p>
              <Button
                onClick={handleLink}
                className="w-full bg-[#4A154B] hover:bg-[#3B0E3B] text-white transition-all duration-300 shadow-lg hover:shadow-purple-500/25 flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white">
                  <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.523-2.522v-2.522h2.523zM15.165 17.688a2.527 2.527 0 0 1-2.523-2.523 2.526 2.526 0 0 1 2.523-2.52h6.312A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
                </svg>
                Add to Slack
              </Button>
              <div className="p-4 rounded-xl bg-muted/50 border border-primary/10">
                <h4 className="font-semibold flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-primary" /> Features included
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">✨ Log expenses via text or Whisper Voice Notes</li>
                  <li className="flex items-center gap-2">✨ Receipts scanning via image upload</li>
                  <li className="flex items-center gap-2">✨ Tax Audit &amp; Wealth Challenge LangGraph Agents</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1 text-sm font-medium">
                  Your Slack account is successfully linked and active.
                </div>
              </div>
              <Button
                onClick={handleUnlink}
                disabled={isLinking}
                variant="destructive"
                className="w-full"
              >
                Unlink Account
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </SkeletonWrapper>
  );
}
