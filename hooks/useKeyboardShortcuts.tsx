"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";

interface Shortcut {
  key: string;
  description: string;
  action: () => void;
}

interface KeyboardShortcutsProps {
  shortcuts: Shortcut[];
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Show help dialog with ?
      if (e.key === "?" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setShowHelp(true);
        return;
      }

      // Find and execute matching shortcut
      const shortcut = shortcuts.find((s) => {
        const keys = s.key.split("+");
        const hasCtrl = keys.includes("Ctrl") || keys.includes("Cmd");
        const hasShift = keys.includes("Shift");
        const hasAlt = keys.includes("Alt");
        const mainKey = keys[keys.length - 1].toLowerCase();

        const ctrlMatch = hasCtrl ? (e.ctrlKey || e.metaKey) : !e.ctrlKey && !e.metaKey;
        const shiftMatch = hasShift ? e.shiftKey : !e.shiftKey;
        const altMatch = hasAlt ? e.altKey : !e.altKey;
        const keyMatch = e.key.toLowerCase() === mainKey.toLowerCase();

        return ctrlMatch && shiftMatch && altMatch && keyMatch;
      });

      if (shortcut) {
        e.preventDefault();
        shortcut.action();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [shortcuts]);

  return { showHelp, setShowHelp };
}

export function KeyboardShortcutsHelp({
  shortcuts,
  open,
  onOpenChangeAction,
}: {
  shortcuts: Shortcut[];
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these shortcuts to navigate faster
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
            >
              <span className="text-sm text-muted-foreground">
                {shortcut.description}
              </span>
              <kbd className="rounded bg-muted px-3 py-1.5 text-sm font-semibold">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
          <p className="font-semibold">Tip:</p>
          <p>Press <kbd className="rounded bg-background px-2 py-0.5">Ctrl + ?</kbd> to show this help dialog anytime</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
