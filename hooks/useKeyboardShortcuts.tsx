"use client";

import React, { useEffect, useState, Fragment } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Keyboard, Sparkles } from "lucide-react";

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
      const target = e.target as HTMLElement;
      if (
        ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
        target.isContentEditable
      ) {
        return;
      }

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
      <DialogContent className="max-w-3xl overflow-hidden p-0 border-none shadow-2xl bg-gradient-to-br from-background via-background to-primary/5">
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <Keyboard className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold tracking-tight">
                Keyboard Shortcuts
              </DialogTitle>
              <DialogDescription className="text-foreground/60">
                Master your workflow with these keyboard controls
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
            {shortcuts.map((shortcut, index) => (
              <div
                key={index}
                className="group flex items-center justify-between py-2.5 border-b border-border/40 last:border-0 hover:bg-primary/[0.02] -mx-2 px-2 rounded-lg transition-colors"
              >
                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  {shortcut.description}
                </span>
                <div className="flex gap-1 items-center">
                  {shortcut.key.split("+").map((part, i, arr) => (
                    <Fragment key={i}>
                      <kbd className="inline-flex h-6 items-center justify-center rounded-md border bg-muted/50 px-2 font-mono text-[10px] font-bold text-foreground/80 shadow-[0_2px_0_0_rgba(0,0,0,0.1)] group-hover:bg-background transition-colors min-w-[24px]">
                        {part.trim()}
                      </kbd>
                      {i < arr.length - 1 && <span className="text-[10px] text-muted-foreground/50">+</span>}
                    </Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="m-6 p-4 rounded-2xl bg-gradient-to-r from-primary/5 via-violet-500/5 to-indigo-500/5 border border-primary/10 shadow-inner">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-7 w-7 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-amber-600" />
            </div>
            <p className="font-bold text-sm bg-gradient-to-r from-amber-600 to-amber-700 bg-clip-text text-transparent">
              Power User Insights
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ul className="space-y-2 text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
              <li className="flex items-start gap-2 italic">
                <span className="text-amber-500 mt-1">•</span>
                Use the <strong className="text-foreground/90 font-semibold uppercase tracking-tighter">Command Palette</strong> as a global jump menu.
              </li>
              <li className="flex items-start gap-2 italic">
                <span className="text-amber-500 mt-1">•</span>
                Quickly search across all data without using your mouse.
              </li>
            </ul>
            <ul className="space-y-2 text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
              <li className="flex items-start gap-2 italic">
                <span className="text-amber-500 mt-1">•</span>
                Combined with <strong className="text-foreground/90 font-semibold uppercase tracking-tighter">Privacy Mode</strong> (eye icon) for secure viewing.
              </li>
              <li className="flex items-start gap-2 italic">
                <span className="text-amber-500 mt-1">•</span>
                Press <kbd className="text-[9px] bg-background border px-1 rounded shadow-sm">?</kbd> with any key to reveal help.
              </li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
