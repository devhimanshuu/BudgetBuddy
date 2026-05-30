"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle2, HelpCircle, BookHeart } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import SkeletonWrapper from "@/components/SkeletonWrapper";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UpdateNotionSettings, UnlinkNotion } from "../_actions/notion";

export function NotionSettingsCard() {
  const [apiKey, setApiKey] = useState("");
  const [dbId, setDbId] = useState("");
  const [isLinking, setIsLinking] = useState(false);

  // Fetch user settings to see if already linked
  const userSettingsQuery = useQuery({
    queryKey: ["userSettings"],
    queryFn: () => fetch("/api/user-settings").then((res) => res.json()),
  });

  const isLinked = !!(userSettingsQuery.data?.notionApiKey && userSettingsQuery.data?.notionDatabaseId);

  const handleLink = async () => {
    if (!apiKey || !dbId) return toast.error("Please enter both the API Key and Database ID");
    setIsLinking(true);
    try {
      await UpdateNotionSettings(apiKey, dbId);
      toast.success("Notion database linked successfully!");
      userSettingsQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to link Notion");
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlink = async () => {
    setIsLinking(true);
    try {
      await UnlinkNotion();
      toast.success("Notion account unlinked");
      setApiKey("");
      setDbId("");
      userSettingsQuery.refetch();
    } catch (error: any) {
      toast.error("Failed to unlink Notion");
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <SkeletonWrapper isLoading={userSettingsQuery.isLoading}>
      <Card className="border-primary/20 bg-gradient-to-br from-card to-zinc-500/5 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-zinc-900 dark:text-zinc-100">
            <div className="flex items-center gap-2">
              <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="w-5 h-5">
                <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z"/>
              </svg>
              Notion Integration
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
                  <DialogTitle>How to link your Notion Database</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-sm mt-4">
                  <div className="space-y-1">
                    <h4 className="font-semibold flex items-center gap-2 text-foreground">1. Create an Integration</h4>
                    <p className="text-muted-foreground">Go to <strong>notion.so/my-integrations</strong> and create a new integration. Copy the <strong>Internal Integration Secret</strong>. This is your API Key.</p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-semibold flex items-center gap-2 text-foreground">2. Create a Database</h4>
                    <p className="text-muted-foreground">In Notion, create a new Full Page Database. Ensure it has the following properties: <strong>Name (Title), Amount (Number), Category (Select), Type (Select), Date (Date)</strong>.</p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-semibold flex items-center gap-2 text-foreground">3. Connect the Integration</h4>
                    <p className="text-muted-foreground">Click the <code>...</code> menu in the top right of your database, click <strong>Connections</strong>, and select your integration.</p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-semibold flex items-center gap-2 text-foreground">4. Get the Database ID</h4>
                    <p className="text-muted-foreground">Copy the long string of characters from your database URL (between your workspace name and the <code>?v=</code>).</p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
          <CardDescription>
            Automatically sync all your transactions to a personal Notion Database in real-time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isLinked ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Internal Integration Secret (API Key)</label>
                <Input
                  placeholder="secret_xxxxxxxxxxxxxxxxx"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  type="password"
                  className="bg-background/50 backdrop-blur-sm focus-visible:ring-zinc-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Database ID</label>
                <Input
                  placeholder="e.g. 1a2b3c4d5e6f7g8h9i0j..."
                  value={dbId}
                  onChange={(e) => setDbId(e.target.value)}
                  className="bg-background/50 backdrop-blur-sm focus-visible:ring-zinc-500"
                />
              </div>
              <Button
                onClick={handleLink}
                disabled={isLinking || !apiKey || !dbId}
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 transition-all duration-300 shadow-lg hover:shadow-zinc-500/25"
              >
                {isLinking ? "Linking..." : "Link Notion Database"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1 text-sm font-medium">
                  Your Notion database is successfully linked and active.
                </div>
              </div>
              <Button
                onClick={handleUnlink}
                disabled={isLinking}
                variant="destructive"
                className="w-full"
              >
                Unlink Database
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </SkeletonWrapper>
  );
}
