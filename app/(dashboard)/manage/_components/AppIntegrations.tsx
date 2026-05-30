"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TelegramSettingsCard } from "./TelegramSettingsCard";
import { DiscordSettingsCard } from "./DiscordSettingsCard";
import { NotionSettingsCard } from "./NotionSettingsCard";
import { SplitwiseSettingsCard } from "./SplitwiseSettingsCard";
import { Blocks } from "lucide-react";

const TelegramIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

const DiscordIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 127.14 96.36" fill="currentColor" className={className}>
    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.2,46,96.09,53,91.08,65.69,84.69,65.69Z"/>
  </svg>
);

export function AppIntegrations() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 px-1">
        <Blocks className="w-5 h-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold tracking-tight">App Integrations</h2>
      </div>
      
      <Tabs defaultValue="telegram" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="telegram" className="gap-2">
            <TelegramIcon className="w-4 h-4 text-[#229ED9]" /> Telegram
          </TabsTrigger>
          <TabsTrigger value="discord" className="gap-2">
            <DiscordIcon className="w-5 h-4 text-[#5865F2]" /> Discord
          </TabsTrigger>
          <TabsTrigger value="notion" className="gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-zinc-900 dark:text-zinc-100">
              <path d="M4.459 4.208c.746-.606 1.026-.562 2.422-.481l10.87.54c1.166.082 1.488.356 1.488 1.151v13.632c0 .883-.356 1.054-1.393 1.033l-10.934-.52c-1.307-.11-1.63-.332-1.63-1.424V4.208zm1.905 13.048l8.366.398V5.378l-8.366-.356v12.234z"/>
            </svg> Notion
          </TabsTrigger>
          <TabsTrigger value="splitwise" className="gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-[#1CC29F]">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 3c4.97 0 9 4.03 9 9s-4.03 9-9 9-9-4.03-9-9 4.03-9 9-9zm-1.89 12.83l-3.32-3.33 1.41-1.41 1.91 1.91 4.79-4.79 1.41 1.42-6.2 6.2z"/>
            </svg> Splitwise
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="telegram" className="mt-0">
          <TelegramSettingsCard />
        </TabsContent>
        
        <TabsContent value="discord" className="mt-0">
          <DiscordSettingsCard />
        </TabsContent>

        <TabsContent value="notion" className="mt-0">
          <NotionSettingsCard />
        </TabsContent>

        <TabsContent value="splitwise" className="mt-0">
          <SplitwiseSettingsCard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
