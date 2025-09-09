import { cn } from "@/lib/utils";
import {
    Fredoka
} from "next/font/google";


interface LogoProps {
    className?: string;
    size?: number;
}

export function LogoDocs({ className, size = 24 }: LogoProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            className={cn("text-current", className)}
            fill="currentColor"
        >
            {/* Card-style documents with rounded corners */}
            <rect
                x="3"
                y="6"
                width="14"
                height="16"
                rx="2"
                className="fill-blue-500/30 dark:fill-blue-400"
            />
            <rect
                x="4"
                y="4"
                width="14"
                height="16"
                rx="2"
                className="fill-blue-500/80 dark:fill-blue-600"
            />
            <rect
                x="5"
                y="2"
                width="14"
                height="16"
                rx="2"
                className="fill-blue-600/90 dark:fill-blue-800/100"
            />

            {/* Header section on top card */}
            <rect
                x="7"
                y="4"
                width="10"
                height="3"
                rx="1"
                className="fill-white"
            />

            {/* Content lines */}
            <line
                x1="7"
                y1="9"
                x2="17"
                y2="9"
                strokeWidth="0.5"
                className="stroke-white/60"
            />
            <line
                x1="7"
                y1="11"
                x2="15"
                y2="11"
                strokeWidth="0.5"
                className="stroke-white/60"
            />
            <line
                x1="7"
                y1="13"
                x2="16"
                y2="13"
                strokeWidth="0.5"
                className="stroke-white/60"
            />
        </svg>
    );
}



const fredokaOne = Fredoka({
    weight: "400",
    subsets: ["latin"],
});

export function Logo({ className, showDocs = false, docsSize = 36 }: { className?: string, showDocs?: boolean, docsSize?: number }) {
    return (
        <div
            className={cn(
                `${fredokaOne.className} flex flex-row items-center text-2xl font-bold bg-clip-text text-black dark:text-white tracking-tight`,
                className
            )}
        >
            {showDocs && <LogoDocs size={docsSize} className="mt-1.5" />}
            nice69hack
        </div>
    );
}