"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageSquare, CheckCircle2, HelpCircle } from "lucide-react";
import { LinkDiscordUser, UnlinkDiscordUser } from "../../_actions/discord";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import SkeletonWrapper from "@/components/SkeletonWrapper";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function DiscordSettingsCard() {
  const [discordId, setDiscordId] = useState("");
  const [isLinking, setIsLinking] = useState(false);

  const userSettingsQuery = useQuery({
    queryKey: ["userSettings"],
    queryFn: () => fetch("/api/user-settings").then((res) => res.json()),
  });

  const isLinked = !!userSettingsQuery.data?.discordUserId;

  const handleLink = async () => {
    if (!discordId) return toast.error("Please enter a Discord User ID");
    setIsLinking(true);
    try {
      await LinkDiscordUser(discordId);
      toast.success("Discord account linked successfully!");
      userSettingsQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to link account");
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlink = async () => {
    setIsLinking(true);
    try {
      await UnlinkDiscordUser();
      toast.success("Discord account unlinked");
      setDiscordId("");
      userSettingsQuery.refetch();
    } catch (error: any) {
      toast.error("Failed to unlink account");
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <SkeletonWrapper isLoading={userSettingsQuery.isLoading}>
      <Card className="border-primary/20 bg-gradient-to-br from-card to-indigo-500/5 shadow-xl h-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-indigo-500">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Discord Integration
            </div>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1 text-muted-foreground hover:text-foreground">
                  <HelpCircle className="w-4 h-4" />
                  How to Use
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>How to use Discord Bot</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-sm mt-4">
                  <div className="space-y-1">
                    <h4 className="font-semibold flex items-center gap-2 text-foreground">📝 Text Logging</h4>
                    <p className="text-muted-foreground">DM the bot something like <strong>&quot;50 for food&quot;</strong> or <strong>&quot;100 income from salary&quot;</strong>.</p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-semibold flex items-center gap-2 text-foreground">🤖 AI Chatbot</h4>
                    <p className="text-muted-foreground">Send <strong>/chatbot</strong> to ask your financial persona questions! Send <strong>/exit</strong> to leave.</p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-semibold flex items-center gap-2 text-foreground">🔘 Interactive Flow</h4>
                    <p className="text-muted-foreground">The bot will ask for Notes, Tags, and Splits using native Discord buttons.</p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
          <CardDescription>
            Log expenses instantly via Discord Direct Messages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLinked ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 p-4 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium text-sm">Your Discord account is linked!</span>
              </div>
              <p className="text-sm text-muted-foreground">
                You can now DM the bot to add expenses automatically.
              </p>
              <Button variant="destructive" size="sm" onClick={handleUnlink} disabled={isLinking}>
                Unlink Account
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground space-y-2">
                <p>1. Open Discord and DM the BudgetBuddy Bot.</p>
                <p>2. Send <strong>/start</strong> to the bot.</p>
                <p>3. The bot will reply with your <strong>User ID</strong>.</p>
                <p>4. Paste that ID below:</p>
              </div>

              <div className="flex gap-2">
                <div className="flex-1 space-y-1">
                  <Input
                    placeholder="Enter Discord User ID"
                    value={discordId}
                    onChange={(e) => setDiscordId(e.target.value)}
                  />
                </div>
                <Button onClick={handleLink} disabled={isLinking || !discordId}>
                  Link
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </SkeletonWrapper>
  );
}
