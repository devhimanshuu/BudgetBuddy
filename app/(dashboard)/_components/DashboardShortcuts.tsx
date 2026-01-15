"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  useKeyboardShortcuts,
  KeyboardShortcutsHelp,
} from "@/hooks/useKeyboardShortcuts";
import QuickAddWidget from "@/components/QuickAddWidget";

export default function DashboardShortcuts() {
  const router = useRouter();
  const [showIncomeDialog, setShowIncomeDialog] = useState(false);
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);

  const shortcuts = [
    {
      key: "Ctrl+I",
      description: "Add new income transaction",
      action: () => setShowIncomeDialog(true),
    },
    {
      key: "Ctrl+E",
      description: "Add new expense transaction",
      action: () => setShowExpenseDialog(true),
    },
    {
      key: "Ctrl+B",
      description: "Go to Budgets page",
      action: () => router.push("/budgets"),
    },
    {
      key: "Ctrl+T",
      description: "Go to Transactions page",
      action: () => router.push("/transactions"),
    },
    {
      key: "Ctrl+A",
      description: "Go to Analytics page",
      action: () => router.push("/analytics"),
    },
    {
      key: "Ctrl+M",
      description: "Go to Manage page",
      action: () => router.push("/manage"),
    },
    {
      key: "Ctrl+H",
      description: "Go to Home/Dashboard",
      action: () => router.push("/"),
    },
  ];

  const { showHelp, setShowHelp } = useKeyboardShortcuts(shortcuts);

  return (
    <>
      <QuickAddWidget />
      <KeyboardShortcutsHelp
        shortcuts={shortcuts}
        open={showHelp}
        onOpenChangeAction={setShowHelp}
      />
    </>
  );
}
