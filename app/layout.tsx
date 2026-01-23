import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import RootProvider from "@/components/providers/RootProvider";
import { Toaster } from "@/components/ui/sonner";
import OfflineIndicator from "@/components/OfflineIndicator";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Budget Buddy",
  description: "Your Personal Financial Buddy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className="dark"
        style={{ colorScheme: "dark" }}
        suppressHydrationWarning
      >
        <body className={inter.className} suppressHydrationWarning>
          <Toaster richColors position="bottom-right" />
          <RootProvider>{children}</RootProvider>
          <OfflineIndicator />
        </body>
      </html>
    </ClerkProvider>
  );
}
