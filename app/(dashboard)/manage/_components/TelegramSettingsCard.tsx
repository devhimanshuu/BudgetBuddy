"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, CheckCircle2, Sparkles, HelpCircle, FileText, Mic, Camera, Brain, Bot, Bell, MousePointerClick } from "lucide-react";
import { LinkTelegramChat, UnlinkTelegramChat } from "../_actions/telegram";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import SkeletonWrapper from "@/components/SkeletonWrapper";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function TelegramSettingsCard() {
  const [chatId, setChatId] = useState("");
  const [isLinking, setIsLinking] = useState(false);

  // Fetch user settings to see if already linked
  const userSettingsQuery = useQuery({
    queryKey: ["userSettings"],
    queryFn: () => fetch("/api/user-settings").then((res) => res.json()),
  });

  const isLinked = !!userSettingsQuery.data?.telegramChatId;

  const handleLink = async () => {
    if (!chatId) return toast.error("Please enter a Chat ID");
    setIsLinking(true);
    try {
      await LinkTelegramChat(chatId);
      toast.success("Telegram account linked successfully!");
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
      await UnlinkTelegramChat();
      toast.success("Telegram account unlinked");
      setChatId("");
      userSettingsQuery.refetch();
    } catch (error: any) {
      toast.error("Failed to unlink account");
    } finally {
      setIsLinking(false);
    }
  };

  const copyBotUsername = () => {
    navigator.clipboard.writeText("@Budgetbuddy0bot");
    toast.success("Copied bot username!");
  };

  return (
    <SkeletonWrapper isLoading={userSettingsQuery.isLoading}>
      <Card className="border-primary/20 bg-gradient-to-br from-card to-blue-500/5 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-blue-500">
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Telegram Integration
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
                  <DialogTitle>How to use BudgetBuddy Bot</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-sm mt-4">
                  <div className="space-y-1">
                    <h4 className="font-semibold flex items-center gap-2 text-foreground"><FileText className="w-4 h-4 text-primary" /> Text Logging</h4>
                    <p className="text-muted-foreground">Type something like <strong>&quot;50 for food&quot;</strong> or <strong>&quot;100 income from salary&quot;</strong>.</p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-semibold flex items-center gap-2 text-foreground"><Mic className="w-4 h-4 text-primary" /> Hands-Free Drive Mode</h4>
                    <p className="text-muted-foreground">Hold the mic icon and say <strong>&quot;I spent twenty dollars on taxi&quot;</strong>. The bot transcribes via Whisper and auto-logs hands-free.</p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-semibold flex items-center gap-2 text-foreground"><Camera className="w-4 h-4 text-primary" /> Receipt Scanning</h4>
                    <p className="text-muted-foreground">Send a photo of a receipt and the bot will extract the details for you.</p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-semibold flex items-center gap-2 text-foreground"><Brain className="w-4 h-4 text-primary" /> Emotional Intelligence</h4>
                    <p className="text-muted-foreground">When logging, the bot analyzes your sentiment and responds with financial empathy based on your AI persona.</p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-semibold flex items-center gap-2 text-foreground"><Bot className="w-4 h-4 text-primary" /> Autonomous AI Agents</h4>
                    <p className="text-muted-foreground">Type <strong>/taxaudit</strong> to find hidden deductions, or <strong>/challenge</strong> to have the Wealth Agent review your recent spending against goals.</p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-semibold flex items-center gap-2 text-foreground"><MousePointerClick className="w-4 h-4 text-primary" /> Interactive Flow</h4>
                    <p className="text-muted-foreground">The bot will ask for Notes, Tags, and Splits. You can use the buttons to quickly skip steps.</p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-semibold flex items-center gap-2 text-foreground"><Bell className="w-4 h-4 text-primary" /> Smart Bill Reminders</h4>
                    <p className="text-muted-foreground">The bot automatically checks your Recurring Transactions and will message you the day before a bill is due!</p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
          <CardDescription>
            Add expenses instantly by messaging our Telegram bot
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLinked ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 p-4 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium text-sm">Your Telegram account is linked!</span>
              </div>
              <p className="text-sm text-muted-foreground">
                You can now send messages like <strong>&quot;50 for lunch&quot;</strong> to the bot to automatically add expenses.
              </p>
              <Button variant="destructive" size="sm" onClick={handleUnlink} disabled={isLinking}>
                Unlink Account
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground space-y-2">
                <p>1. Open Telegram and search for <strong className="text-foreground cursor-pointer" onClick={copyBotUsername}>@Budgetbuddy0bot</strong></p>
                <p>2. Send any message to the bot (e.g. &quot;hello&quot;)</p>
                <p>3. The bot will reply with your <strong>Chat ID</strong>.</p>
                <p>4. Paste that ID below:</p>
              </div>

              <div className="flex gap-2">
                <div className="flex-1 space-y-1">
                  <Input
                    placeholder="Enter Telegram Chat ID"
                    value={chatId}
                    onChange={(e) => setChatId(e.target.value)}
                  />
                </div>
                <Button onClick={handleLink} disabled={isLinking}>
                  Link
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2 border-t border-border/50">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <p className="text-xs text-muted-foreground">
              More app integrations coming soon — WhatsApp, Slack &amp; more.
            </p>
          </div>
        </CardContent>
      </Card>
    </SkeletonWrapper>
  );
}
