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
import CreateVaultEntryDialog from "@/app/(dashboard)/vault/_components/CreateVaultEntryDialog";
import CreateWorkspaceDialog from "@/components/CreateWorkspaceDialog";
import { CommandPalette } from "@/components/CommandPalette";

export default function DashboardShortcuts({
  onQuickAddOpenChange,
  onAIChatOpen,
}: {
  onQuickAddOpenChange?: (isOpen: boolean) => void;
  onAIChatOpen?: () => void;
}) {
  const router = useRouter();

  const [showIncomeDialog, setShowIncomeDialog] = useState(false);
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [showInvestmentDialog, setShowInvestmentDialog] = useState(false);
  const [showAssetDialog, setShowAssetDialog] = useState(false);
  const [showVaultEntryDialog, setShowVaultEntryDialog] = useState(false);
  const [showWorkspaceDialog, setShowWorkspaceDialog] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  const shortcuts = [
    {
      key: "Ctrl+K",
      description: "Open Command Palette",
      action: () => setShowCommandPalette((prev) => !prev),
    },
    {
      key: "Ctrl+J",
      description: "Open AI Assistant",
      action: () => onAIChatOpen?.(),
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
      key: "I",
      description: "New Transaction (Investment)",
      action: () => setShowInvestmentDialog(true),
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
    {
      key: "V",
      description: "Go to Vault",
      action: () => router.push("/vault"),
    },
    {
      key: "L",
      description: "New Vault Entry",
      action: () => setShowVaultEntryDialog(true),
    },
    {
      key: "W",
      description: "New Workspace",
      action: () => setShowWorkspaceDialog(true),
    },
  ];

  const { showHelp, setShowHelp } = useKeyboardShortcuts(shortcuts);

  return (
    <>
      <QuickAddWidget
        onIncomeClick={() => setShowIncomeDialog(true)}
        onExpenseClick={() => setShowExpenseDialog(true)}
        onInvestmentClick={() => setShowInvestmentDialog(true)}
        onAssetClick={() => setShowAssetDialog(true)}
        onOpenChange={onQuickAddOpenChange}
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
      <CreateTransactionDialog
        open={showInvestmentDialog}
        onOpenChange={setShowInvestmentDialog}
        type="investment"
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
        onInvestmentClick={() => setShowInvestmentDialog(true)}
        onAssetClick={() => setShowAssetDialog(true)}
        onAIChatClick={() => onAIChatOpen?.()}
        onVaultEntryClick={() => setShowVaultEntryDialog(true)}
        onWorkspaceClick={() => setShowWorkspaceDialog(true)}
      />

      <CreateVaultEntryDialog
        open={showVaultEntryDialog}
        onOpenChange={setShowVaultEntryDialog}
        trigger={null}
      />

      <CreateWorkspaceDialog
        open={showWorkspaceDialog}
        onOpenChange={setShowWorkspaceDialog}
        trigger={null}
      />

      <KeyboardShortcutsHelp
        shortcuts={shortcuts}
        open={showHelp}
        onOpenChangeAction={setShowHelp}
      />
    </>
  );
}
