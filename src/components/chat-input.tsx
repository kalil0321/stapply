"use client";

import React, { useRef, useState } from "react";
import { Mic, MicOff, Send, Loader2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

type DictationState = "idle" | "recording" | "error";

// Declare interfaces for SpeechRecognition API
interface SpeechRecognitionResult {
    transcript: string;
}

interface SpeechRecognitionEvent {
    results: SpeechRecognitionResult[][];
}

interface SpeechRecognitionConstructor {
    new (): SpeechRecognition;
}

interface SpeechRecognition {
    lang: string;
    interimResults: boolean;
    maxAlternatives: number;
    onstart: () => void;
    onerror: () => void;
    onend: () => void;
    onresult: (event: SpeechRecognitionEvent) => void;
    start: () => void;
    stop: () => void;
}

declare global {
    interface Window {
        SpeechRecognition?: SpeechRecognitionConstructor;
        webkitSpeechRecognition?: SpeechRecognitionConstructor;
    }
}

interface ChatInputProps {
    value: string;
    setValue: (value: string) => void;
    onSend: () => void;
    isLoading?: boolean;
    minHeight?: string;
    maxHeight?: string;
    className?: string;
    showLiveSearch?: boolean;
    isLiveSearchEnabled?: boolean;
    onLiveSearchToggle?: (enabled: boolean) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
    value,
    setValue,
    onSend,
    isLoading,
    minHeight = "44px",
    maxHeight = "200px",
    className = "",
    showLiveSearch = false,
    isLiveSearchEnabled = false,
    onLiveSearchToggle,
}) => {
    const [dictationState, setDictationState] =
        useState<DictationState>("idle");
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    // Speech recognition logic
    const handleDictation = () => {
        if (dictationState === "recording") {
            recognitionRef.current?.stop();
            setDictationState("idle");
            return;
        }

        if (
            !(
                "webkitSpeechRecognition" in window ||
                "SpeechRecognition" in window
            )
        ) {
            setDictationState("error");
            return;
        }

        const SpeechRecognition =
            window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setDictationState("error");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setDictationState("recording");
        recognition.onerror = () => setDictationState("error");
        recognition.onend = () => setDictationState("idle");
        recognition.onresult = (event: SpeechRecognitionEvent) => {
            const transcript = event.results[0][0].transcript;
            setValue(value ? value + " " + transcript : transcript);
            setDictationState("idle");
            textareaRef.current?.focus();
            // Trigger resize after adding text
            if (textareaRef.current) {
                textareaRef.current.style.height = "auto";
                textareaRef.current.style.height =
                    textareaRef.current.scrollHeight + "px";
            }
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    // Auto-resize textarea
    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setValue(e.target.value);
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height =
                textareaRef.current.scrollHeight + "px";
        }
    };

    const handleSend = async () => {
        if (!value.trim() || isLoading) return;
        onSend();
        setValue("");
        // Reset height after sending
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className={cn("w-full max-w-2xl mx-auto", className)}>
            {/* Live Search Toggle */}
            {/* {showLiveSearch && (
                <div className="flex items-center justify-between mb-3 p-2 rounded-lg bg-muted/30 border border-border/50">
                    <div className="flex items-center gap-2">
                        <Button
                            variant={isLiveSearchEnabled ? "default" : "ghost"}
                            size="sm"
                            onClick={() => onLiveSearchToggle?.(!isLiveSearchEnabled)}
                            className={cn(
                                "flex items-center gap-2 text-sm transition-all duration-300 hover:scale-105",
                                isLiveSearchEnabled
                                    ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
                                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                            )}
                        >
                            <Zap size={14} className={cn(
                                "transition-all duration-300",
                                isLiveSearchEnabled ? "text-primary-foreground" : "text-muted-foreground"
                            )} />
                            Live Search
                            {isLiveSearchEnabled && (
                                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                            )}
                        </Button>
                        <span className={cn(
                            "text-xs transition-all duration-300",
                            isLiveSearchEnabled 
                                ? "text-primary font-medium" 
                                : "text-muted-foreground"
                        )}>
                            {isLiveSearchEnabled 
                                ? "Real-time web search" 
                                : "Database search"
                            }
                        </span>
                    </div>
                    {isLiveSearchEnabled && (
                        <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 animate-in fade-in slide-in-from-right-2">
                            <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                            Active
                        </div>
                    )}
                </div>
            )} */}
            
            <div className="flex items-center gap-2 bg-background border border-border rounded-xl px-4 py-3 shadow-sm transition-all duration-200">
                <textarea
                    ref={textareaRef}
                    className="flex-1 resize-none bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-base py-2 leading-relaxed"
                    placeholder="Search..."
                    value={value}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                    autoFocus
                    rows={1}
                    style={{
                        minHeight,
                        maxHeight,
                        overflow: "hidden",
                    }}
                />

                <Button
                    variant="ghost"
                    onClick={handleDictation}
                    size="sm"
                    className={cn(
                        "h-8 w-8 p-0 rounded-lg transition-all duration-200 flex-shrink-0",
                        "hover:bg-accent hover:text-accent-foreground",
                        dictationState === "recording" &&
                            "bg-primary/10 text-primary"
                    )}
                    aria-label={
                        dictationState === "recording"
                            ? "Stop dictation"
                            : "Start dictation"
                    }
                >
                    {dictationState === "recording" ? (
                        <MicOff size={16} className="text-primary" />
                    ) : (
                        <Mic size={16} />
                    )}
                </Button>

                <Button
                    onClick={handleSend}
                    disabled={!value.trim() || isLoading}
                    size="sm"
                    className={cn(
                        "h-8 w-8 p-0 rounded-lg transition-all duration-200 flex-shrink-0",
                        !value.trim() || isLoading
                            ? "bg-muted hover:bg-muted text-muted-foreground cursor-not-allowed"
                            : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md"
                    )}
                    aria-label="Send message"
                >
                    {isLoading ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : (
                        <Send size={16} />
                    )}
                </Button>
            </div>

            {dictationState === "error" && (
                <div className="text-xs text-destructive mt-2 ml-2 animate-in fade-in slide-in-from-bottom-1">
                    Dictation not supported or error occurred.
                </div>
            )}
        </div>
    );
};
