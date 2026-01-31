"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, Bot, User, Loader2, Sparkles, MinusCircle, Maximize2, Minimize2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatWithAI } from "@/app/(dashboard)/_actions/ai";
import { cn } from "@/lib/utils";

interface Message {
    role: "user" | "model";
    parts: { text: string }[];
}

interface AIChatWindowProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AIChatWindow({ isOpen, onClose }: AIChatWindowProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: "smooth",
            });
        }
    }, [messages, isLoading]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            role: "user",
            parts: [{ text: input }],
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            // We send the history EXCEPT the message we just added (the action will handle it)
            const result = await ChatWithAI(input, messages);

            if (result.error) {
                setMessages((prev) => [
                    ...prev,
                    { role: "model", parts: [{ text: result.error as string }] },
                ]);
            } else if (result.text) {
                setMessages((prev) => [
                    ...prev,
                    { role: "model", parts: [{ text: result.text as string }] },
                ]);
            }
        } catch (error) {
            setMessages((prev) => [
                ...prev,
                { role: "model", parts: [{ text: "Something went wrong. Please try again." }] },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        height: isMinimized ? "60px" : "500px",
                    }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    className={cn(
                        "absolute bottom-20 right-0 w-[380px] z-50 overflow-hidden",
                        "bg-card/80 backdrop-blur-xl border border-border shadow-2xl rounded-2xl flex flex-col",
                        isMinimized && "w-[200px]"
                    )}
                >
                    {/* Header */}
                    <div className="p-4 border-b border-border flex items-center justify-between bg-primary/5">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-primary" />
                            </div>
                            <span className="font-semibold text-sm">Budget Buddy AI</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setIsMinimized(!isMinimized)}
                            >
                                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {!isMinimized && (
                        <>
                            {/* Chat Area */}
                            <ScrollArea className="flex-1 p-4 h-[380px]" scrollHideDelay={100}>
                                <div className="space-y-4 pr-4" ref={scrollRef}>
                                    {messages.length === 0 && (
                                        <div className="text-center py-8">
                                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                                                <Bot className="w-6 h-6 text-primary" />
                                            </div>
                                            <p className="text-sm text-muted-foreground px-4">
                                                Hello! I&apos;m your AI Financial Analyst. Ask me anything about your spending, budgets, or savings goals!
                                            </p>
                                            <div className="mt-4 flex flex-wrap gap-2 justify-center">
                                                {["Spending analysis", "Budget status", "Savings tips"].map((tip) => (
                                                    <button
                                                        key={tip}
                                                        onClick={() => setInput(tip)}
                                                        className="text-xs px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 border border-border transition-colors text-muted-foreground"
                                                    >
                                                        {tip}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {messages.map((msg, i) => (
                                        <div
                                            key={i}
                                            className={cn(
                                                "flex w-full gap-3",
                                                msg.role === "user" ? "justify-end" : "justify-start"
                                            )}
                                        >
                                            {msg.role === "model" && (
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                    <Bot className="w-4 h-4 text-primary" />
                                                </div>
                                            )}
                                            <div
                                                className={cn(
                                                    "max-w-[85%] rounded-2xl px-4 py-2 text-sm",
                                                    msg.role === "user"
                                                        ? "bg-primary text-primary-foreground"
                                                        : "bg-secondary border border-border text-foreground"
                                                )}
                                            >
                                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                                    <ReactMarkdown>
                                                        {msg.parts[0].text}
                                                    </ReactMarkdown>
                                                </div>
                                            </div>
                                            {msg.role === "user" && (
                                                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 border border-border">
                                                    <User className="w-4 h-4" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {isLoading && (
                                        <div className="flex gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                                            </div>
                                            <div className="bg-secondary border border-border rounded-2xl px-4 py-2 text-sm flex items-center gap-1">
                                                Thinking...
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>

                            {/* Input Area */}
                            <div className="p-4 border-t border-border bg-background/50">
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        handleSend();
                                    }}
                                    className="flex gap-2"
                                >
                                    <Input
                                        placeholder="Ask about your budget..."
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        disabled={isLoading}
                                        className="h-10 border-border focus-visible:ring-primary/20"
                                    />
                                    <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="h-10 w-10 shrink-0">
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </form>
                                <p className="text-[10px] text-center text-muted-foreground mt-2">
                                    Powered by Gemini AI • Analysis based on your data
                                </p>
                            </div>
                        </>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
