"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, Bot, User, Loader2, Maximize2, Minimize2, PiggyBank } from "lucide-react";
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
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
                        height: isMinimized ? "60px" : "auto", // Allow auto height
                        maxHeight: isMinimized ? "60px" : "min(600px, 70vh)", // Cap at 70vh or 600px
                    }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    className={cn(
                        "absolute bottom-20 right-0 w-[90vw] sm:w-[380px] z-50 overflow-hidden",
                        "bg-card/95 backdrop-blur-xl border border-border shadow-2xl rounded-2xl flex flex-col", // Increased opacity/blur
                        isMinimized && "w-[200px]"
                    )}
                >
                    {/* Header */}
                    <div className={cn(
                        "p-3 border-b border-border flex items-center justify-between bg-primary/5 shrink-0 transition-all duration-300",
                        isMinimized && "h-full border-b-0 justify-center" // Fill height, remove border, center content
                    )}>
                        <div className={cn("flex items-center gap-2", isMinimized && "mr-auto")}>
                            {/* Hide icon when minimized to save space if needed, or keep it. Let's keep it but adjust layout if needed. 
                                Actually, if we center justify, we need to handle the buttons. 
                                Let's use absolute positioning for buttons if we want true center, 
                                OR just normal flex behavior which is usually fine if h-full is there.
                                The user said "text in middle". 
                             */}
                            <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                                <PiggyBank className="w-4 h-4 text-amber-500" />
                            </div>
                            <span className="font-bold text-sm whitespace-nowrap bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                                Budget Buddy AI
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent potentially triggering other clicks
                                    setIsMinimized(!isMinimized);
                                }}
                            >
                                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {!isMinimized && (
                        <>
                            {/* Chat Area */}
                            <div className="flex-1 overflow-y-auto p-4 min-h-0 custom-scrollbar">
                                <div className="space-y-4 pr-1">
                                    {messages.length === 0 && (
                                        <div className="text-center py-6">
                                            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
                                                <Bot className="w-6 h-6 text-amber-500" />
                                            </div>
                                            <p className="text-sm text-balance text-muted-foreground px-4">
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
                                                "flex w-full gap-2",
                                                msg.role === "user" ? "justify-end" : "justify-start"
                                            )}
                                        >
                                            {msg.role === "model" && (
                                                <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 mt-1">
                                                    <Bot className="w-3.5 h-3.5 text-amber-500" />
                                                </div>
                                            )}
                                            <div
                                                className={cn(
                                                    "max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                                                    msg.role === "user"
                                                        ? "bg-primary text-primary-foreground"
                                                        : "bg-secondary/50 border border-border/50 text-foreground"
                                                )}
                                            >
                                                <div className="text-sm leading-relaxed">
                                                    <ReactMarkdown
                                                        components={{
                                                            p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                                                            ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                                                            ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                                                            li: ({ children }) => <li className="mb-0.5">{children}</li>,
                                                            h1: ({ children }) => <h1 className="text-base font-bold mb-2">{children}</h1>,
                                                            h2: ({ children }) => <h2 className="text-sm font-bold mb-1">{children}</h2>,
                                                            h3: ({ children }) => <h3 className="text-xs font-bold mb-1 uppercase text-muted-foreground">{children}</h3>,
                                                            blockquote: ({ children }) => <blockquote className="border-l-2 border-primary/50 pl-2 italic my-2">{children}</blockquote>,
                                                            code: ({ className, children }) => {
                                                                const match = /language-(\w+)/.exec(className || "");
                                                                return match ? (
                                                                    <code className="block bg-muted p-2 rounded text-xs my-2 overflow-x-auto">
                                                                        {children}
                                                                    </code>
                                                                ) : (
                                                                    <code className="bg-muted/50 px-1 py-0.5 rounded text-xs font-mono">
                                                                        {children}
                                                                    </code>
                                                                );
                                                            },
                                                        }}
                                                    >
                                                        {msg.parts[0].text}
                                                    </ReactMarkdown>
                                                </div>
                                            </div>
                                            {msg.role === "user" && (
                                                <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center shrink-0 border border-border mt-1">
                                                    <User className="w-3.5 h-3.5" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {isLoading && (
                                        <div className="flex gap-2">
                                            <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center mt-1">
                                                <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                                            </div>
                                            <div className="bg-secondary/50 border border-border/50 rounded-2xl px-4 py-2 text-sm flex items-center gap-1">
                                                <span className="text-muted-foreground text-xs">Thinking...</span>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                            </div>

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
                                    Powered by Groq • Analysis based on your data
                                </p>
                            </div>
                        </>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
