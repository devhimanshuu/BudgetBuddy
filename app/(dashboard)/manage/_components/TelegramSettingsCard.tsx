"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageCircle, Send, CheckCircle2, Copy } from "lucide-react";
import { LinkTelegramChat, UnlinkTelegramChat } from "../_actions/telegram";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import SkeletonWrapper from "@/components/SkeletonWrapper";

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
    <SkeletonWrapper isLoading={userSettingsQuery.isFetching}>
      <Card className="border-primary/20 bg-gradient-to-br from-card to-blue-500/5 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-500">
            <Send className="w-5 h-5" />
            Telegram Integration
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
                You can now send messages like <strong>"50 for lunch"</strong> to the bot to automatically add expenses.
              </p>
              <Button variant="destructive" size="sm" onClick={handleUnlink} disabled={isLinking}>
                Unlink Account
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground space-y-2">
                <p>1. Open Telegram and search for <strong className="text-foreground cursor-pointer" onClick={copyBotUsername}>@Budgetbuddy0bot</strong></p>
                <p>2. Send any message to the bot (e.g. "hello")</p>
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
        </CardContent>
      </Card>
    </SkeletonWrapper>
  );
}
