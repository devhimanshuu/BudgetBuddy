"use client";

import { Button } from "@/components/ui/button";
import { Plus, Coins } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface QuickAddWidgetProps {
  onIncomeClick: () => void;
  onExpenseClick: () => void;
  onAssetClick: () => void;
}

export default function QuickAddWidget({
  onIncomeClick,
  onExpenseClick,
  onAssetClick,
}: QuickAddWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-40 3xl:bottom-8 3xl:right-8">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="mb-4 flex flex-col gap-3 items-end"
          >
            {/* Asset Button */}
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.05 }}
            >
              <Button
                onClick={() => {
                  onAssetClick();
                  setIsOpen(false);
                }}
                className="group relative h-12 gap-2 overflow-hidden border-blue-500 bg-blue-600 pr-4 shadow-lg hover:bg-blue-700 hover:shadow-xl rounded-full"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <Coins className="h-5 w-5" />
                <span className="relative z-10 font-semibold">Add Asset</span>
              </Button>
            </motion.div>

            {/* Income Button */}
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Button
                onClick={() => {
                  onIncomeClick();
                  setIsOpen(false);
                }}
                className="group relative h-12 gap-2 overflow-hidden border-emerald-500 bg-emerald-600 pr-4 shadow-lg hover:bg-emerald-700 hover:shadow-xl rounded-full"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <Plus className="h-5 w-5" />
                <span className="relative z-10 font-semibold">Add Income</span>
              </Button>
            </motion.div>

            {/* Expense Button */}
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              <Button
                onClick={() => {
                  onExpenseClick();
                  setIsOpen(false);
                }}
                className="group relative h-12 gap-2 overflow-hidden border-red-500 bg-red-600 pr-4 shadow-lg hover:bg-red-700 hover:shadow-xl rounded-full"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <Plus className="h-5 w-5" />
                <span className="relative z-10 font-semibold">Add Expense</span>
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "group relative h-16 w-16 overflow-hidden rounded-full shadow-2xl transition-all duration-300",
            isOpen
              ? "bg-gray-600 hover:bg-gray-700"
              : "bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          )}
        >
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

          {/* Icon */}
          <motion.div
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.3 }}
            className="relative z-10"
          >
            <Plus className="h-8 w-8 text-white" />
          </motion.div>

          {/* Ripple effect */}
          <div className="absolute inset-0 animate-pulse-soft rounded-full bg-white/10" />
        </Button>
      </motion.div>
    </div>
  );
}
