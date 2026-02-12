"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, Bot, User, Loader2, Maximize2, Minimize2, PiggyBank, Mic, MicOff, Volume2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatWithAI } from "@/app/(dashboard)/_actions/ai";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, BarChart3, ImagePlus } from "lucide-react";
import { ExtractReceiptData } from "@/app/(dashboard)/_actions/extractReceipt";
import { ConvertCurrency } from "@/app/(dashboard)/_actions/conversion";
import { GetUserSettings } from "@/app/(dashboard)/_actions/user-settings";

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
    const [isExpanded, setIsExpanded] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [pendingReceipt, setPendingReceipt] = useState<any>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            // ... (omitted same lines for brevity, actually I should include them in replacement)
            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = false;
                recognitionRef.current.interimResults = false;
                recognitionRef.current.lang = "en-US";

                recognitionRef.current.onresult = (event: any) => {
                    const transcript = event.results[0][0].transcript;
                    setInput(transcript);
                    setIsListening(false);
                };

                recognitionRef.current.onerror = (event: any) => {
                    console.error("Speech recognition error", event.error);
                    setIsListening(false);
                    toast.error("Voice recognition failed. Please try again.");
                };

                recognitionRef.current.onend = () => {
                    setIsListening(false);
                };
            }
        }
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            toast.error("Speech recognition is not supported in your browser.");
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
        } else {
            setIsListening(true);
            recognitionRef.current.start();
        }
    };

    const speakText = (text: string) => {
        if (typeof window !== "undefined" && window.speechSynthesis) {
            // Cancel any current speaking
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            window.speechSynthesis.speak(utterance);
        } else {
            toast.error("Text-to-speech is not supported in your browser.");
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    const LivingUIRenderer = ({ text }: { text: string }) => {
        // Find [COMPONENT: {json}]
        const components: React.ReactNode[] = [];

        // Match [PROGRESS_BAR: {...}]
        const progressBarRegex = /\[PROGRESS_BAR:\s*({[\s\S]*?})\s*\]/g;
        let match;
        while ((match = progressBarRegex.exec(text)) !== null) {
            try {
                const jsonStr = match[1].trim();
                if (!jsonStr.endsWith("}")) continue; // Incomplete JSON
                const data = JSON.parse(jsonStr);
                components.push(
                    <div key={`pb-${match.index}`} className="mt-4 p-3 rounded-lg bg-background/50 border border-border shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-semibold">{data.label}</span>
                            <span className="text-[10px] text-muted-foreground">{((data.current / data.target) * 100).toFixed(0)}%</span>
                        </div>
                        <Progress value={(data.current / data.target) * 100} className={cn("h-1.5", data.color === "orange" ? "bg-orange-500/20" : "")} />
                        <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                            <span>{data.current} spent</span>
                            <span>{data.target} budget</span>
                        </div>
                    </div>
                );
            } catch (e) { /* Fail silently during typing */ }
        }

        // Match [MINI_TREND: {...}]
        const trendRegex = /\[MINI_TREND:\s*({[\s\S]*?})\s*\]/g;
        while ((match = trendRegex.exec(text)) !== null) {
            try {
                const jsonStr = match[1].trim();
                if (!jsonStr.endsWith("}")) continue; // Incomplete JSON
                const data = JSON.parse(jsonStr);
                components.push(
                    <div key={`trend-${match.index}`} className="mt-4 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 shadow-sm flex items-center gap-3">
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                        <div className="flex-1">
                            <p className="text-xs font-semibold text-emerald-600">{data.label}</p>
                            <div className="flex items-end gap-0.5 h-6 mt-1">
                                {data.data.map((v: number, i: number) => (
                                    <div key={i} className="flex-1 bg-emerald-400/50 rounded-t-sm" style={{ height: `${(v / Math.max(...data.data)) * 100}%` }} />
                                ))}
                            </div>
                        </div>
                    </div>
                );
            } catch (e) { /* Fail silently during typing */ }
        }

        // Match [BAR_CHART: {...}]
        const barChartRegex = /\[BAR_CHART:\s*({[\s\S]*?})\s*\]/g;
        while ((match = barChartRegex.exec(text)) !== null) {
            try {
                let jsonStr = match[1].trim();

                // Stricter check: Bar chart JSON must end with "}]" or "}}" to be considered "complete"
                if (!jsonStr.endsWith("}]") && !jsonStr.endsWith("}}")) {
                    continue;
                }

                // Extremely permissive: if it looks like single quotes are used, try to fix them
                if (jsonStr.includes("'") && !jsonStr.includes('"')) {
                    jsonStr = jsonStr.replace(/'/g, '"');
                }

                const data = JSON.parse(jsonStr);
                const chartData = Array.isArray(data) ? data : (data.data || []);

                if (!Array.isArray(chartData) || chartData.length === 0) {
                    console.log("LivingUI: BarChart has no data", data);
                    continue;
                }

                components.push(
                    <div key={`bar-${match.index}`} className="mt-4 p-4 rounded-xl bg-card border border-border shadow-md animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="flex items-center gap-2 mb-4">
                            <BarChart3 className="h-4 w-4 text-primary" />
                            <span className="text-sm font-bold tracking-tight">{data.title || "Financial Breakdown"}</span>
                        </div>
                        <div className="flex items-end gap-3 h-40 px-2 pb-6">
                            {chartData.map((item: any, i: number) => {
                                const label = item.label || item.name || item.category || item.date || `Item ${i + 1}`;
                                const value = Number(item.value || item.amount || 0);
                                const rawMaxValue = Math.max(...chartData.map((d: any) => Number(d.value || d.amount || 0)));
                                const maxValue = rawMaxValue > 0 ? rawMaxValue : 1;
                                const heightPercentage = Math.max((value / maxValue) * 100, 5); // Min 5% height for visibility

                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                                        <div className="relative w-full group">
                                            <div
                                                className="w-full bg-primary/20 rounded-t-lg absolute bottom-0 left-0 transition-all duration-700"
                                                style={{ height: `${heightPercentage}%` }}
                                            />
                                            <div
                                                className="w-full bg-primary rounded-t-lg absolute bottom-0 left-0 transition-all duration-1000 group-hover:bg-primary/80"
                                                style={{ height: `${heightPercentage}%`, transformOrigin: 'bottom' }}
                                            />
                                            {/* Tooltip on hover */}
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-sm border border-border pointer-events-none z-10">
                                                {value.toFixed(2)}
                                            </div>
                                        </div>
                                        <div className="h-4 flex items-center justify-center w-full">
                                            <span className="text-[10px] font-medium text-muted-foreground truncate w-full text-center group-hover:text-foreground transition-colors">
                                                {label}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            } catch (e: any) {
                // Only log if we have a full-looking tag that failed
                if (match[1].includes('"data"') || match[1].includes("'data'")) {
                    console.error("LivingUI: BarChart Parse Failed", e.message, match[1]);
                }
            }
        }

        return <>{components}</>;
    };

    const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Please upload an image file");
            return;
        }

        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            toast.error("Image must be less than 5MB");
            return;
        }

        setIsLoading(true);
        toast.loading("Scanning receipt...", { id: "receipt-scan" });

        try {
            // Convert to base64
            const reader = new FileReader();
            reader.onload = async () => {
                const base64 = reader.result as string;

                const result = await ExtractReceiptData(base64);

                if (result.success && result.data) {
                    const { merchant, amount, date, currency: receiptCurrency, category } = result.data;

                    // Fetch user settings to get base currency
                    const userSettings = await GetUserSettings();
                    const baseCurrency = userSettings.currency;

                    let displayMsg = `🧾 **Receipt Detected!**\n\nI found a ${receiptCurrency || "USD"} ${amount?.toFixed(2) || "??"} receipt from **${merchant || "Unknown Merchant"}**${date ? ` on ${date}` : ""}.`;

                    let finalAmount = amount;

                    if (receiptCurrency && receiptCurrency !== baseCurrency && amount) {
                        const conv = await ConvertCurrency(amount, receiptCurrency, baseCurrency);
                        if (conv.success) {
                            finalAmount = conv.convertedAmount;
                            displayMsg += `\n\n🌍 **Multi-Currency Reconciliation**:\nConverted to **${baseCurrency} ${finalAmount.toFixed(2)}** (Rate: ${conv.rate.toFixed(4)})\nKeep track in your local currency!`;
                        }
                    }

                    setPendingReceipt({
                        ...result.data,
                        amount: finalAmount, // Use the converted amount for the transaction
                        originalAmount: amount,
                        originalCurrency: receiptCurrency
                    });

                    const confirmMsg = `${displayMsg}\n\nShould I log this under **${category || "Other"}**?\n\n*Click "Confirm" below to create this transaction.*`;

                    setMessages(prev => [...prev, {
                        role: "model",
                        parts: [{ text: confirmMsg }]
                    }]);

                    toast.success("Receipt scanned & reconciled!", { id: "receipt-scan" });
                } else {
                    toast.error(result.error || "Failed to scan receipt", { id: "receipt-scan" });
                    setMessages(prev => [...prev, {
                        role: "model",
                        parts: [{ text: "❌ I couldn't extract data from that receipt. Please try a clearer image or enter the transaction manually." }]
                    }]);
                }
            };
            reader.readAsDataURL(file);
        } catch (error) {
            toast.error("Failed to process receipt", { id: "receipt-scan" });
        } finally {
            setIsLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const typeMessage = (fullText: string) => {
        // First add the empty model message
        setMessages((prev) => [...prev, { role: "model", parts: [{ text: "" }] }]);

        let i = 0;
        const speed = 10;

        const typeChar = () => {
            if (i < fullText.length) {
                const currentText = fullText.substring(0, i + 1);
                setMessages((prev) => {
                    const next = [...prev];
                    const lastIdx = next.length - 1;
                    if (next[lastIdx] && next[lastIdx].role === "model") {
                        // Crucially: replace the entire text with the current substring
                        // This prevents doubling if the updater runs twice (StrictMode)
                        next[lastIdx] = {
                            ...next[lastIdx],
                            parts: [{ text: currentText }]
                        };
                    }
                    return next;
                });
                i++;
                setTimeout(typeChar, speed);
            }
        };

        typeChar();
    };

    const handleConfirmReceipt = async () => {
        if (!pendingReceipt) return;

        const { merchant, amount, date, category } = pendingReceipt;

        // Create a natural language request for the AI
        const transactionRequest = `Create an expense transaction for ${amount} from ${merchant || "Unknown"} under ${category || "Other"} category${date ? ` on ${date}` : ""}`;

        // Add user message
        const userMessage: Message = {
            role: "user",
            parts: [{ text: transactionRequest }],
        };

        setMessages((prev) => [...prev, userMessage]);
        setPendingReceipt(null);
        setIsLoading(true);

        try {
            const result = await ChatWithAI(transactionRequest, messages);

            if (result.error) {
                typeMessage(result.error as string);
            } else if (result.text) {
                typeMessage(result.text as string);
            }
        } catch (error) {
            typeMessage("Failed to create transaction. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

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
                typeMessage(result.error as string);
            } else if (result.text) {
                typeMessage(result.text as string);

                if (result.filter) {
                    const params = new URLSearchParams();
                    const f = result.filter;
                    if (f.query) params.set("query", f.query);
                    if (f.category) params.set("category", f.category);
                    if (f.type) params.set("type", f.type);
                    if (f.minAmount) params.set("minAmount", f.minAmount.toString());
                    if (f.maxAmount) params.set("maxAmount", f.maxAmount.toString());
                    if (f.from) params.set("from", f.from);
                    if (f.to) params.set("to", f.to);

                    router.push(`/transactions?${params.toString()}`);
                    toast.success("Applied search filters!");
                }
            }
        } catch (error) {
            typeMessage("Something went wrong. Please try again.");
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
                        height: isMinimized ? "60px" : (isExpanded ? "85vh" : "auto"),
                        maxHeight: isMinimized ? "60px" : (isExpanded ? "85vh" : "min(600px, 70vh)"),
                        width: isMinimized ? "200px" : (isExpanded ? "min(95vw, 1000px)" : "min(90vw, 380px)"),
                    }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    className={cn(
                        "absolute bottom-20 right-0 z-50 overflow-hidden",
                        "bg-card/95 backdrop-blur-xl border border-border shadow-2xl rounded-2xl flex flex-col",
                        isExpanded && "right-4 sm:right-8" // Center it a bit more when expanded
                    )}
                >
                    {/* Header */}
                    <div className={cn(
                        "p-3 border-b border-border flex items-center justify-between bg-primary/5 shrink-0 transition-all duration-300",
                        isMinimized && "h-full border-b-0 justify-center" // Fill height, remove border, center content
                    )}>
                        <div className={cn("flex items-center gap-2", isMinimized && "mr-auto")}>
                            <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                                <PiggyBank className="w-4 h-4 text-amber-500" />
                            </div>
                            <span className="font-bold text-sm whitespace-nowrap bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                                Budget Buddy AI
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            {!isMinimized && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    title={isExpanded ? "Shrink" : "Expand"}
                                >
                                    {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent potentially triggering other clicks
                                    setIsMinimized(!isMinimized);
                                    if (isExpanded) setIsExpanded(false); // Can't be expanded and minimized
                                }}
                                title={isMinimized ? "Show" : "Hide"}
                            >
                                {isMinimized ? <Maximize2 className="h-4 w-4 rotate-45" /> : <X className="h-4 w-4" />}
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
                                                <Bot className="w-6 h-6" />
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
                                                    "max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm relative group",
                                                    msg.role === "user"
                                                        ? "bg-primary text-primary-foreground"
                                                        : "bg-secondary/50 border border-border/50 text-foreground"
                                                )}
                                            >
                                                {msg.role === "model" && (
                                                    <button
                                                        onClick={() => speakText(msg.parts[0].text)}
                                                        className="absolute -right-8 top-1 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-secondary rounded-full"
                                                        title="Speak response"
                                                    >
                                                        <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
                                                    </button>
                                                )}
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
                                                    <LivingUIRenderer text={msg.parts[0].text} />
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
                                {pendingReceipt && (
                                    <div className="mb-3 flex gap-2">
                                        <Button
                                            type="button"
                                            onClick={handleConfirmReceipt}
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                                            disabled={isLoading}
                                        >
                                            ✓ Confirm & Create Transaction
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setPendingReceipt(null)}
                                            disabled={isLoading}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                )}
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        handleSend();
                                    }}
                                    className="flex gap-2"
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleReceiptUpload}
                                        className="hidden"
                                    />
                                    <div className="flex gap-1">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => fileInputRef.current?.click()}
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
                                            onClick={toggleListening}
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
                        </>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
