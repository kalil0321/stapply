"use client";

import { motion } from "framer-motion";
import { Sparkles, TrendingUp, Zap } from "lucide-react";

interface SuggestionsProps {
    suggestions: string[];
    onSuggestionClick?: (suggestion: string) => void;
    className?: string;
}

const suggestionIcons = [Sparkles, TrendingUp, Zap];

export function Suggestions({
    suggestions,
    onSuggestionClick,
    className = "",
}: SuggestionsProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={`mt-8 ${className}`}
        >
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-center mb-6"
            >
                <p className="text-sm text-muted-foreground font-medium">
                    Popular searches
                </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {suggestions.map((suggestion, index) => {
                    const Icon =
                        suggestionIcons[index % suggestionIcons.length];
                    return (
                        <motion.button
                            key={suggestion}
                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{
                                duration: 0.4,
                                delay: index * 0.1 + 0.4,
                                type: "spring",
                                stiffness: 100,
                            }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onSuggestionClick?.(suggestion)}
                            className="group cursor-pointer relative overflow-hidden bg-gradient-to-br from-background to-muted/30 hover:from-background hover:to-muted/50 rounded-2xl border border-border/50 hover:border-border p-4 text-left transition-all duration-300 shadow-sm hover:shadow-md"
                        >
                            <div className="relative flex items-start gap-3">
                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                                    <Icon size={16} className="text-primary" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors duration-300 leading-relaxed">
                                        {suggestion}
                                    </p>
                                </div>
                            </div>
                        </motion.button>
                    );
                })}
            </div>
        </motion.div>
    );
}
