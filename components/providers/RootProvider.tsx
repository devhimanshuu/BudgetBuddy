"use client";

import { ThemeProvider } from "next-themes";
import React, { ReactNode, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AccentProvider } from "./AccentProvider";
import { PrivacyProvider } from "./PrivacyProvider";
const RootProvider = ({ children }: { children: ReactNode }) => {
  const [queryClient] = useState(() => new QueryClient({}));
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
        themes={["light", "dark", "midnight", "solaris", "cyberpunk", "forest", "gold-standard"]}
        value={{
          light: "light",
          dark: "dark",
          midnight: "midnight",
          solaris: "solaris",
          cyberpunk: "cyberpunk",
          forest: "forest",
          "gold-standard": "gold-standard",
        }}
      >
        <AccentProvider>
          <PrivacyProvider>
            {children}
          </PrivacyProvider>
        </AccentProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};

export default RootProvider;
