import Logo from "@/components/Logo";
import ParticlesBackground from "@/components/landing/ParticlesBackground";
import { Coins, PieChart, TrendingUp, Wallet } from "lucide-react";
import React, { ReactNode } from "react";

const layout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center overflow-y-auto overflow-x-hidden bg-background py-8 sm:py-12">
      {/* Particles Background */}
      <ParticlesBackground />

      {/* Gradient Blobs */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 -z-10 h-[600px] w-full blur-[120px] pointer-events-none opacity-70 dark:opacity-20 bg-gradient-to-tr from-indigo-500/30 via-purple-500/30 to-amber-500/30 dark:from-primary/40 dark:via-purple-500/20 dark:to-amber-500/10" />
      <div className="fixed -top-10 -left-10 -z-10 h-72 w-72 rounded-full bg-amber-500/20 blur-[100px]" />
      <div className="fixed -bottom-10 -right-10 -z-10 h-72 w-72 rounded-full bg-purple-500/20 blur-[100px]" />

      {/* Floating Icons Container */}
      <div className="fixed inset-0 pointer-events-none mx-auto w-full max-w-[1000px] h-full">
        <div className="absolute top-[20%] left-[10%] opacity-20 animate-float hidden md:block">
          <Coins className="w-12 h-12 text-amber-500" />
        </div>
        <div className="absolute bottom-[20%] right-[10%] opacity-20 animate-float hidden md:block" style={{ animationDelay: '1s' }}>
          <PieChart className="w-14 h-14 text-emerald-500" />
        </div>
        <div className="absolute top-[30%] right-[15%] opacity-15 animate-float hidden md:block" style={{ animationDelay: '2s' }}>
          <TrendingUp className="w-16 h-16 text-blue-500" />
        </div>
        <div className="absolute bottom-[25%] left-[15%] opacity-15 animate-float hidden md:block" style={{ animationDelay: '3s' }}>
          <Wallet className="w-12 h-12 text-purple-500" />
        </div>
      </div>

      {/* Logo */}
      <div className="relative z-10 mb-2 sm:mb-4">
        <Logo />
      </div>

      {/* Auth Content */}
      <div className="relative z-10 w-full max-w-md px-4 pb-2">
        {children}
      </div>
    </div>
  );
};

export default layout;
