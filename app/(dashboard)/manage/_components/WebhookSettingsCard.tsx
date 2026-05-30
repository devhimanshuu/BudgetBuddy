"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, RefreshCw, Webhook, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation } from "@tanstack/react-query";
import SkeletonWrapper from "@/components/SkeletonWrapper";
import { GenerateWebhookToken, GetWebhookToken, GetWebhookLogs } from "../_actions/webhook";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { WebhookLog } from "@prisma/client";

export function WebhookSettingsCard() {
  const [copied, setCopied] = useState(false);

  const tokenQuery = useQuery({
    queryKey: ["webhookToken"],
    queryFn: GetWebhookToken,
  });

  const logsQuery = useQuery({
    queryKey: ["webhookLogs"],
    queryFn: GetWebhookLogs,
  });

  const generateMutation = useMutation({
    mutationFn: GenerateWebhookToken,
    onSuccess: () => {
      toast.success("Webhook token generated!");
      tokenQuery.refetch();
    },
    onError: () => toast.error("Failed to generate token"),
  });

  const webhookUrl = tokenQuery.data
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/incoming/${tokenQuery.data}`
    : "";

  const handleCopy = () => {
    if (webhookUrl) {
      navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <SkeletonWrapper isLoading={tokenQuery.isLoading}>
      <Card className="border-emerald-500/20 bg-gradient-to-br from-card to-emerald-500/5 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500">
            <Webhook className="w-5 h-5" />
            Universal Webhooks
          </CardTitle>
          <CardDescription>
            Connect BudgetBuddy to Zapier, IFTTT, or Apple Shortcuts to build your own automations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Your Webhook Endpoint</h3>
            {tokenQuery.data ? (
              <div className="flex gap-2">
                <code className="flex-1 px-3 py-2 bg-muted rounded-md text-xs sm:text-sm font-mono overflow-x-auto whitespace-nowrap border border-border">
                  {webhookUrl}
                </code>
                <Button onClick={handleCopy} variant="outline" className="shrink-0 gap-2">
                  {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </Button>
                <Button
                  onClick={() => generateMutation.mutate()}
                  disabled={generateMutation.isPending}
                  variant="outline"
                  className="shrink-0 text-destructive border-destructive hover:bg-destructive hover:text-white"
                >
                  <RefreshCw className={`w-4 h-4 ${generateMutation.isPending ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto"
              >
                Generate Webhook URL
              </Button>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              <strong>Keep this secret.</strong> Anyone with this URL can log transactions to your account.
            </p>
          </div>

          <Tabs defaultValue="nlp" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="nlp">AI Parsing</TabsTrigger>
              <TabsTrigger value="structured">Structured JSON</TabsTrigger>
            </TabsList>
            <TabsContent value="nlp" className="p-4 bg-muted/50 rounded-xl border mt-2 text-xs font-mono">
              <p className="text-muted-foreground mb-2 font-sans text-sm">Send a natural language string and Groq AI will parse it automatically.</p>
              POST {webhookUrl || 'YOUR_WEBHOOK_URL'}<br />
              Content-Type: application/json<br /><br />
              {`{ "text": "Spent 15 on a Netflix subscription" }`}
            </TabsContent>
            <TabsContent value="structured" className="p-4 bg-muted/50 rounded-xl border mt-2 text-xs font-mono">
              <p className="text-muted-foreground mb-2 font-sans text-sm">Send precise structured data for exact logging.</p>
              POST {webhookUrl || 'YOUR_WEBHOOK_URL'}<br />
              Content-Type: application/json<br /><br />
              {`{\n  "amount": 15,\n  "category": "Entertainment",\n  "type": "expense",\n  "description": "Netflix"\n}`}
            </TabsContent>
          </Tabs>

          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Webhook className="w-4 h-4" /> Recent Activity Logs
            </h3>
            <SkeletonWrapper isLoading={logsQuery.isLoading}>
              {logsQuery.data && logsQuery.data.length > 0 ? (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {logsQuery.data.map((log: WebhookLog) => (
                    <div key={log.id} className="p-3 bg-muted/30 border rounded-lg flex flex-col gap-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                        {log.status === "SUCCESS" ? (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">SUCCESS</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">ERROR</Badge>
                        )}
                      </div>
                      <div className="font-mono text-xs bg-background p-2 rounded border">
                        <span className="text-muted-foreground">Payload:</span> {JSON.stringify(log.payload)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No webhook logs yet. Send a request to see it appear here!</p>
              )}
            </SkeletonWrapper>
          </div>
        </CardContent>
      </Card>
    </SkeletonWrapper>
  );
}
