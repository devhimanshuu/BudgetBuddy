"use client"

import * as React from "react"
import {
  Settings,
  LayoutDashboard,
  PiggyBank,
  TrendingUp,
  LineChart,
  Wallet,
  TrendingDown,
  Calendar,
  Coins,
  Bot,
} from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { useRouter } from "next/navigation"

interface CommandPaletteProps {
  open: boolean
  setOpen: (open: boolean) => void
  onIncomeClick: () => void
  onExpenseClick: () => void
  onAssetClick: () => void
  onAIChatClick: () => void
}

export function CommandPalette({ open, setOpen, onIncomeClick, onExpenseClick, onAssetClick, onAIChatClick }: CommandPaletteProps) {
  const router = useRouter()

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false)
    command()
  }, [setOpen])

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => runCommand(onAIChatClick)}>
            <Bot className="mr-2 h-4 w-4 text-purple-500" />
            <span>AI Assistant</span>
            <CommandShortcut>⌘J</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(onIncomeClick)}>
            <TrendingUp className="mr-2 h-4 w-4 text-emerald-500" />
            <span>New Income</span>
            <CommandShortcut>⌘I</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(onExpenseClick)}>
            <TrendingDown className="mr-2 h-4 w-4 text-red-500" />
            <span>New Expense</span>
            <CommandShortcut>⌘E</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(onAssetClick)}>
            <Coins className="mr-2 h-4 w-4 text-blue-500" />
            <span>New Asset</span>
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard"))}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
            <CommandShortcut>⌘H</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/transactions"))}>
            <Wallet className="mr-2 h-4 w-4" />
            <span>Transactions</span>
            <CommandShortcut>⌘T</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/assets"))}>
            <Coins className="mr-2 h-4 w-4" />
            <span>Assets</span>
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/budgets"))}>
            <PiggyBank className="mr-2 h-4 w-4" />
            <span>Budgets</span>
            <CommandShortcut>⌘B</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/analytics"))}>
            <LineChart className="mr-2 h-4 w-4" />
            <span>Analytics</span>
            <CommandShortcut>⌘A</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/calendar"))}>
            <Calendar className="mr-2 h-4 w-4" />
            <span>Calendar</span>
            <CommandShortcut>⌘C</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/manage"))}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Manage</span>
            <CommandShortcut>⌘M</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
