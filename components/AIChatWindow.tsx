"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Loader2 } from "lucide-react";
import { ChatWithAI } from "@/app/(dashboard)/_actions/ai";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ExtractReceiptData } from "@/app/(dashboard)/_actions/extractReceipt";
import { ConvertCurrency } from "@/app/(dashboard)/_actions/conversion";
import { GetUserSettings } from "@/app/(dashboard)/_actions/user-settings";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

// Refactored Components
import { ChatHeader } from "./chat/ChatHeader";
import { ChatInput } from "./chat/ChatInput";
import { MessageItem } from "./chat/MessageItem";
import { HealthScoreBar } from "./chat/HealthScoreBar";

export interface Message {
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
    const [userPersona, setUserPersona] = useState<string | null>(null);
    const [healthScore, setHealthScore] = useState<number | null>(null);
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    // Load history on mount
    useEffect(() => {
        const savedPersona = localStorage.getItem("budget-buddy-user-persona");
        if (savedPersona) setUserPersona(savedPersona);

        const saved = localStorage.getItem("budget-buddy-chat-history");
        if (saved) {
            try {
                const { messages: savedMessages, timestamp } = JSON.parse(saved);
                const isRecent = Date.now() - timestamp < 24 * 60 * 60 * 1000;
                if (isRecent && savedMessages.length > 0) {
                    setMessages(savedMessages);
                }
            } catch (e) {
                console.error("Failed to load chat history", e);
            }
        }
    }, []);

    // Save history whenever messages change
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem("budget-buddy-chat-history", JSON.stringify({
                messages,
                timestamp: Date.now()
            }));
        }
        if (userPersona) {
            localStorage.setItem("budget-buddy-user-persona", userPersona);
        }
    }, [messages, userPersona]);

    const clearHistory = () => {
        setMessages([]);
        setUserPersona(null);
        localStorage.removeItem("budget-buddy-chat-history");
        localStorage.removeItem("budget-buddy-user-persona");
        setShowClearConfirm(false);
        toast.success("History cleared");
    };

    useEffect(() => {
        if (typeof window !== "undefined") {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
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

    const typeMessage = (fullText: string) => {
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

    const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            toast.error("Please upload an image file");
            return;
        }
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            toast.error("Image must be less than 5MB");
            return;
        }

        setIsLoading(true);
        toast.loading("Scanning receipt...", { id: "receipt-scan" });

        try {
            const reader = new FileReader();
            reader.onload = async () => {
                const base64 = reader.result as string;
                const result = await ExtractReceiptData(base64);

                if (result.success && result.data) {
                    const { merchant, amount, date, currency: receiptCurrency, category } = result.data;
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
                        amount: finalAmount,
                        originalAmount: amount,
                        originalCurrency: receiptCurrency
                    });

                    const confirmMsg = `${displayMsg}\n\nShould I log this under **${category || "Other"}**?\n\n*Click "Confirm" below to create this transaction.*`;
                    setMessages(prev => [...prev, { role: "model", parts: [{ text: confirmMsg }] }]);
                    toast.success("Receipt scanned & reconciled!", { id: "receipt-scan" });
                } else {
                    toast.error(result.error || "Failed to scan receipt", { id: "receipt-scan" });
                    setMessages(prev => [...prev, { role: "model", parts: [{ text: "❌ I couldn't extract data from that receipt. Please try a clearer image or enter the transaction manually." }] }]);
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

    const handleConfirmReceipt = async () => {
        if (!pendingReceipt) return;
        const { merchant, amount, date, category } = pendingReceipt;
        const transactionRequest = `Create an expense transaction for ${amount} from ${merchant || "Unknown"} under ${category || "Other"} category${date ? ` on ${date}` : ""}`;
        
        const userMessage: Message = { role: "user", parts: [{ text: transactionRequest }] };
        setMessages((prev) => [...prev, userMessage]);
        setPendingReceipt(null);
        setIsLoading(true);

        try {
            const result = await ChatWithAI(transactionRequest, messages);
            if (result.error) {
                typeMessage(result.error as string);
            } else if (result.text) {
                if (result.persona) setUserPersona(result.persona);
                if (result.healthScore !== undefined) setHealthScore(result.healthScore);
                typeMessage(result.text as string);
            }
        } catch (error) {
            typeMessage("Failed to create transaction. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = async (overrideInput?: string) => {
        const messageText = overrideInput || input;
        if (!messageText.trim() || isLoading) return;

        const userMessage: Message = { role: "user", parts: [{ text: messageText }] };
        setMessages((prev) => [...prev, userMessage]);
        if (!overrideInput) setInput("");
        setIsLoading(true);

        try {
            const result = await ChatWithAI(messageText, messages);
            if (result.error) {
                typeMessage(result.error as string);
            } else if (result.text) {
                typeMessage(result.text as string);
                if (result.persona) setUserPersona(result.persona);
                if (result.healthScore !== undefined) setHealthScore(result.healthScore);

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
                        isExpanded && "right-4 sm:right-8"
                    )}
                >
                    <ChatHeader 
                        isMinimized={isMinimized}
                        isExpanded={isExpanded}
                        userPersona={userPersona}
                        onToggleMinimize={() => {
                            setIsMinimized(!isMinimized);
                            if (isExpanded) setIsExpanded(false);
                        }}
                        onToggleExpand={() => setIsExpanded(!isExpanded)}
                        onClearHistory={() => setShowClearConfirm(true)}
                    />

                    {!isMinimized && healthScore !== null && (
                        <HealthScoreBar healthScore={healthScore} />
                    )}

                    {!isMinimized && (
                        <>
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
                                        <MessageItem 
                                            key={i}
                                            role={msg.role}
                                            text={msg.parts[0].text}
                                            onSpeak={speakText}
                                            onSendSuggestion={handleSend}
                                        />
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

                            <ChatInput 
                                input={input}
                                setInput={setInput}
                                isLoading={isLoading}
                                isListening={isListening}
                                onSend={handleSend}
                                onToggleListening={toggleListening}
                                onUploadClick={() => fileInputRef.current?.click()}
                                fileInputRef={fileInputRef}
                                onFileChange={handleReceiptUpload}
                                pendingReceipt={pendingReceipt}
                                onConfirmReceipt={handleConfirmReceipt}
                                onCancelReceipt={() => setPendingReceipt(null)}
                            />
                        </>
                    )}

                    <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
                        <AlertDialogContent className="w-[90vw] max-w-[400px] rounded-2xl">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2">
                                    <Trash2 className="h-5 w-5 text-destructive" />
                                    Clear Chat History
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently delete your entire conversation history with Budget Buddy. This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex-row gap-2">
                                <AlertDialogCancel className="flex-1 rounded-xl">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={clearHistory}
                                    className="flex-1 bg-destructive hover:bg-destructive/90 rounded-xl"
                                >
                                    Clear History
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
