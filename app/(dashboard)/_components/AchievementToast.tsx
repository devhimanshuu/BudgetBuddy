"use client";

import { motion } from "framer-motion";
import { X, Trophy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AchievementToastProps {
  t: string | number;
  title: string;
  description: string;
  points: number;
  icon?: string;
}

export const AchievementToast = ({
  t,
  title,
  description,
  points,
  icon = "🏆",
}: AchievementToastProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, x: 20 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="pointer-events-auto relative flex w-full max-w-sm overflow-hidden rounded-xl bg-background border bg-opacity-95 p-4 shadow-xl backdrop-blur-md dark:bg-zinc-900/95"
    >
      {/* Glow Effect */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-transparent/10 animate-pulse" />

      <div className="flex w-full items-start gap-4">
        {/* Icon Section */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 shadow-sm text-white text-2xl">
          {icon}
        </div>

        {/* Content Section */}
        <div className="flex flex-1 flex-col justify-center gap-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500">
            Achievement Unlocked!
          </p>
          <h3 className="font-bold leading-none tracking-tight text-foreground">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground">{description}</p>
          <div className="mt-1 flex items-center gap-1">
            <Trophy className="h-3 w-3 text-amber-500" />
            <span className="text-xs font-bold text-amber-600 dark:text-amber-500">
              +{points} pts
            </span>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={() => toast.dismiss(t)}
          className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground opacity-50 hover:opacity-100 transition-opacity"
        >
          <X size={14} />
        </button>
      </div>
    </motion.div>
  );
};
