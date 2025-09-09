"use client";

import { ChatInput } from "@/components/chat-input";
import { Typewriter } from "@/components/typewriter";
import { Suggestions } from "@/components/suggestions";
import { motion } from "framer-motion";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

const jobTypes = [
    "an internship",
    "a job",
    "a remote position",
    "a startup role",
    "a tech opportunity",
    "your dream career",
];

const suggestions = [
    "Tech internships in Silicon Valley",
    "Remote software engineer positions",
    "AI/ML research opportunities",
    "Startup growth roles",
    "Data science internships",
    "Product management jobs",
];

export default function Page() {
    const [value, setValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const createSearchMutation = useMutation({
        mutationFn: async (query: string) => {
            const response = await fetch("/api/searches", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query }),
            });
            if (!response.ok) {
                throw new Error("Failed to create search");
            }
            return response.json();
        },
    });
    const router = useRouter();

    const handleSuggestionClick = (suggestion: string) => {
        console.log("Suggestion clicked:", suggestion);
        setValue(suggestion);
    };

    const handleSend = async () => {
        if (!value.trim()) return;

        setIsLoading(true);
        try {
            console.log("Sending message:", value);

            const data = await createSearchMutation.mutateAsync(value);
            const searchId = data.id;

            setIsLoading(false);

            console.log("Search ID: ", data.id);

            // Redirect to search page with the database ID
            router.push(`/search/${searchId}?q=${encodeURIComponent(value)}`);
            setValue("");
        } catch (error) {
            console.error("Error creating search:", error);
            // TODO: show error message to user using toast
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-1 flex-col items-center justify-center p-8">
            <motion.div
                className="mb-2 text-center"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
            >
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    Find{" "}
                    <Typewriter
                        texts={jobTypes}
                        className="text-gray-700 dark:text-gray-300"
                        typingSpeed={80}
                        deletingSpeed={40}
                        pauseDuration={2000}
                    />
                </h1>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="w-full max-w-2xl"
            >
                <ChatInput
                    value={value}
                    setValue={setValue}
                    onSend={handleSend}
                    isLoading={isLoading}
                />
                <Suggestions
                    suggestions={suggestions}
                    onSuggestionClick={handleSuggestionClick}
                />
            </motion.div>
        </div>
    );
}
