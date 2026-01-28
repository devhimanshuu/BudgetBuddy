"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  useKeyboardShortcuts,
  KeyboardShortcutsHelp,
} from "@/hooks/useKeyboardShortcuts";
import QuickAddWidget from "@/components/QuickAddWidget";
import CreateTransactionDialog from "@/app/(dashboard)/_components/CreateTransactionDialog";
import CreateAssetDialog from "@/app/(dashboard)/_components/CreateAssetDialog";
import { CommandPalette } from "@/components/CommandPalette";

export default function DashboardShortcuts() {
  const router = useRouter();

  const [showIncomeDialog, setShowIncomeDialog] = useState(false);
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [showAssetDialog, setShowAssetDialog] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  const shortcuts = [
    {
      key: "Ctrl+K",
      description: "Open Command Palette",
      action: () => setShowCommandPalette((prev) => !prev),
    },
    {
      key: "N",
      description: "New Transaction (Income)",
      action: () => setShowIncomeDialog(true),
    },
    {
      key: "Shift+N",
      description: "New Transaction (Expense)",
      action: () => setShowExpenseDialog(true),
    },
    {
      key: "B",
      description: "Go to Budgets",
      action: () => router.push("/budgets"),
    },
    {
      key: "T",
      description: "Go to Transactions",
      action: () => router.push("/transactions"),
    },
    {
      key: "A",
      description: "Go to Analytics",
      action: () => router.push("/analytics"),
    },
    {
      key: "M",
      description: "Go to Manage",
      action: () => router.push("/manage"),
    },
    {
      key: "H",
      description: "Go to Dashboard",
      action: () => router.push("/"),
    },
  ];

  const { showHelp, setShowHelp } = useKeyboardShortcuts(shortcuts);

  return (
    <>
      <QuickAddWidget
        onIncomeClick={() => setShowIncomeDialog(true)}
        onExpenseClick={() => setShowExpenseDialog(true)}
        onAssetClick={() => setShowAssetDialog(true)}
      />

      <CreateTransactionDialog
        open={showIncomeDialog}
        onOpenChange={setShowIncomeDialog}
        type="income"
        trigger={null}
      />
      <CreateTransactionDialog
        open={showExpenseDialog}
        onOpenChange={setShowExpenseDialog}
        type="expense"
        trigger={null}
      />

      <CreateAssetDialog
        open={showAssetDialog}
        onOpenChange={setShowAssetDialog}
        trigger={null}
      />

      <CommandPalette
        open={showCommandPalette}
        setOpen={setShowCommandPalette}
        onIncomeClick={() => setShowIncomeDialog(true)}
        onExpenseClick={() => setShowExpenseDialog(true)}
        onAssetClick={() => setShowAssetDialog(true)}
      />

      <KeyboardShortcutsHelp
        shortcuts={shortcuts}
        open={showHelp}
        onOpenChangeAction={setShowHelp}
      />
    </>
  );
}
