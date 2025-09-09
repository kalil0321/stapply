"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface TypewriterProps {
    texts: string[];
    className?: string;
    typingSpeed?: number;
    deletingSpeed?: number;
    pauseDuration?: number;
}

export function Typewriter({
    texts,
    className = "",
    typingSpeed = 100,
    deletingSpeed = 50,
    pauseDuration = 1500,
}: TypewriterProps) {
    const [currentTextIndex, setCurrentTextIndex] = useState(0);
    const [currentText, setCurrentText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        if (isPaused) {
            const timeout = setTimeout(() => {
                setIsPaused(false);
                setIsDeleting(true);
            }, pauseDuration);
            return () => clearTimeout(timeout);
        }

        const targetText = texts[currentTextIndex];

        if (!isDeleting && currentText === targetText) {
            setIsPaused(true);
            return;
        }

        if (isDeleting && currentText === "") {
            setIsDeleting(false);
            setCurrentTextIndex((prev) => (prev + 1) % texts.length);
            return;
        }

        const timeout = setTimeout(
            () => {
                if (isDeleting) {
                    setCurrentText(
                        targetText.substring(0, currentText.length - 1)
                    );
                } else {
                    setCurrentText(
                        targetText.substring(0, currentText.length + 1)
                    );
                }
            },
            isDeleting ? deletingSpeed : typingSpeed
        );

        return () => clearTimeout(timeout);
    }, [
        currentText,
        currentTextIndex,
        isDeleting,
        isPaused,
        texts,
        typingSpeed,
        deletingSpeed,
        pauseDuration,
    ]);

    return (
        <span className={className}>
            {currentText}
            <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="ml-0.5"
            >
                |
            </motion.span>
        </span>
    );
}
