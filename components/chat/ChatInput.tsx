"use client";

import React, { RefObject } from "react";
import { Mic, MicOff, ImagePlus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ChatInputProps {
    input: string;
    setInput: (val: string) => void;
    isLoading: boolean;
    isListening: boolean;
    onSend: () => void;
    onToggleListening: () => void;
    onUploadClick: () => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    pendingReceipt: any;
    onConfirmReceipt: () => void;
    onCancelReceipt: () => void;
}

export const ChatInput = ({
    input,
    setInput,
    isLoading,
    isListening,
    onSend,
    onToggleListening,
    onUploadClick,
    fileInputRef,
    onFileChange,
    pendingReceipt,
    onConfirmReceipt,
    onCancelReceipt,
}: ChatInputProps) => {
    return (
        <div className="p-4 border-t border-border bg-background/50">
            {pendingReceipt && (
                <div className="mb-3 flex gap-2">
                    <Button
                        type="button"
                        onClick={onConfirmReceipt}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        disabled={isLoading}
                    >
                        ✓ Confirm & Create Transaction
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancelReceipt}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                </div>
            )}
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    onSend();
                }}
                className="flex gap-2"
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={onFileChange}
                    className="hidden"
                />
                <div className="flex gap-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={onUploadClick}
                        className="h-10 w-10 shrink-0"
                        title="Upload receipt"
                        disabled={isLoading}
                    >
                        <ImagePlus className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={onToggleListening}
                        className={cn(
                            "h-10 w-10 shrink-0",
                            isListening && "text-red-500 animate-pulse bg-red-500/10"
                        )}
                    >
                        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                </div>
                <Input
                    placeholder="Ask about your budget..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isLoading}
                    className="h-10 border-border focus-visible:ring-primary/20 pr-10"
                />
                <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="h-10 w-10 shrink-0">
                    <Send className="h-4 w-4" />
                </Button>
            </form>
            <p className="text-[10px] text-center text-muted-foreground mt-2">
                Powered by Groq • Analysis based on your data
            </p>
        </div>
    );
};
