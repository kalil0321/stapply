import { cn } from "@/lib/utils";
import { 
    Fredoka} from "next/font/google";
import { StapplyDocs } from "./logo-small";


const fredokaOne = Fredoka({
    weight: "400",
    subsets: ["latin"],
});

export function Stapply({ className, showDocs = false, docsSize = 36 }: { className?: string, showDocs?: boolean, docsSize?: number }) {
    return (
               <div
            className={cn(
                `${fredokaOne.className} flex flex-row items-center text-2xl font-bold bg-clip-text text-black dark:text-white tracking-tight`,
                className
            )}
        >
            {showDocs && <StapplyDocs size={docsSize} className="mt-1.5" />}
            Stapply
        </div>
    );
}