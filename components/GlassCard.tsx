"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  animate?: boolean;
}

export default function GlassCard({
  children,
  className = "",
  hover = true,
  animate = true,
}: GlassCardProps) {
  const baseClasses =
    "relative overflow-hidden rounded-xl border border-white/20 bg-white/10 backdrop-blur-md shadow-xl dark:border-white/10 dark:bg-black/10";

  const hoverClasses = hover
    ? "transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:border-white/30 dark:hover:border-white/20"
    : "";

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={cn(baseClasses, hoverClasses, className)}
      >
        {/* Gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent dark:from-white/5" />
        
        {/* Content */}
        <div className="relative z-10">{children}</div>
      </motion.div>
    );
  }

  return (
    <div className={cn(baseClasses, hoverClasses, className)}>
      {/* Gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent dark:from-white/5" />
      
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
