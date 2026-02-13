"use client";

import React from "react";
import { Bot, User, Volume2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { LivingUIRenderer } from "./LivingUIRenderer";
import { stripComponentTags } from "./utils";

interface MessageItemProps {
    role: "user" | "model";
    text: string;
    onSpeak: (text: string) => void;
    onSendSuggestion: (text: string) => void;
}

export const MessageItem = ({ role, text, onSpeak, onSendSuggestion }: MessageItemProps) => {
    return (
        <div className={cn("flex w-full gap-2", role === "user" ? "justify-end" : "justify-start")}>
            {role === "model" && (
                <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-3.5 h-3.5 text-amber-500" />
                </div>
            )}
            <div
                className={cn(
                    "max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm relative group",
                    role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary/50 border border-border/50 text-foreground"
                )}
            >
                {role === "model" && (
                    <button
                        onClick={() => onSpeak(text)}
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
                            code: ({ className, children }: any) => {
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
                        {stripComponentTags(text)}
                    </ReactMarkdown>
                    <LivingUIRenderer text={text} onSendSuggestion={onSendSuggestion} />
                </div>
            </div>
            {role === "user" && (
                <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center shrink-0 border border-border mt-1">
                    <User className="w-3.5 h-3.5" />
                </div>
            )}
        </div>
    );
};
