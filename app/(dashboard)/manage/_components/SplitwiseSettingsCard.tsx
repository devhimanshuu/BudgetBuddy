"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, HelpCircle, Handshake } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import SkeletonWrapper from "@/components/SkeletonWrapper";
import { UnlinkSplitwise } from "../_actions/splitwise";
import { useSearchParams, useRouter } from "next/navigation";

export function SplitwiseSettingsCard() {
  const [isUnlinking, setIsUnlinking] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Handle OAuth Callbacks
  useEffect(() => {
    if (searchParams.get("splitwise") === "success") {
      toast.success("Splitwise connected successfully!");
      // Clean up URL
      router.replace("/manage");
    }
    if (searchParams.get("error")) {
      toast.error("Failed to connect Splitwise. Please try again.");
      router.replace("/manage");
    }
  }, [searchParams, router]);

  // Fetch user settings to see if already linked
  const userSettingsQuery = useQuery({
    queryKey: ["userSettings"],
    queryFn: () => fetch("/api/user-settings").then((res) => res.json()),
  });

  const isLinked = !!userSettingsQuery.data?.splitwiseToken;

  const handleUnlink = async () => {
    setIsUnlinking(true);
    try {
      await UnlinkSplitwise();
      toast.success("Splitwise account unlinked");
      userSettingsQuery.refetch();
    } catch (error: any) {
      toast.error("Failed to unlink Splitwise");
    } finally {
      setIsUnlinking(false);
    }
  };

  const handleLink = () => {
    window.location.href = "/api/auth/splitwise";
  };

  return (
    <SkeletonWrapper isLoading={userSettingsQuery.isLoading}>
      <Card className="border-primary/20 bg-gradient-to-br from-card to-emerald-500/5 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-emerald-600 dark:text-emerald-500">
            <div className="flex items-center gap-2">
              <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="w-5 h-5">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 3c4.97 0 9 4.03 9 9s-4.03 9-9 9-9-4.03-9-9 4.03-9 9-9zm-1.89 12.83l-3.32-3.33 1.41-1.41 1.91 1.91 4.79-4.79 1.41 1.42-6.2 6.2z"/>
              </svg>
              Splitwise Integration
            </div>
          </CardTitle>
          <CardDescription>
            Automatically push split bills to Splitwise, and sync settled debts back as income!
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isLinked ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Connect your Splitwise account to automatically share expenses with your friends. You will be redirected to Splitwise to authorize access.
              </p>
              <Button 
                onClick={handleLink} 
                className="w-full bg-[#1CC29F] hover:bg-[#159a7e] text-white transition-all duration-300 shadow-lg hover:shadow-emerald-500/25"
              >
                Connect with Splitwise
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1 text-sm font-medium">
                  Your Splitwise account is successfully connected and active.
                </div>
              </div>
              <div className="flex gap-2 w-full">
                <Button 
                  onClick={async () => {
                    const id = toast.loading("Syncing with Splitwise...");
                    try {
                      const res = await fetch("/api/splitwise/sync", { method: "POST" });
                      const data = await res.json();
                      if (data.success) {
                        toast.success(`Synced ${data.syncedCount} new settlements!`, { id });
                      } else {
                        toast.error(data.error || "Failed to sync", { id });
                      }
                    } catch (e) {
                      toast.error("Failed to sync", { id });
                    }
                  }}
                  variant="outline"
                  className="flex-1 border-[#1CC29F] text-[#1CC29F] hover:bg-[#1CC29F]/10"
                >
                  <Handshake className="w-4 h-4 mr-2" />
                  Sync Now
                </Button>
                <Button 
                  onClick={handleUnlink} 
                  disabled={isUnlinking}
                  variant="destructive"
                  className="flex-1"
                >
                  {isUnlinking ? "Unlinking..." : "Unlink Account"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </SkeletonWrapper>
  );
}
