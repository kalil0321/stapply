import { motion } from "framer-motion";
import { AlertTriangleIcon, LockIcon, SearchIcon } from "lucide-react";

interface SearchErrorStateProps {
    error: string;
}

export function SearchErrorState({ error }: SearchErrorStateProps) {
    const getErrorIcon = () => {
        switch (error) {
            case "Search not found":
                return SearchIcon;
            case "Access denied":
                return LockIcon;
            default:
                return AlertTriangleIcon;
        }
    };

    const ErrorIcon = getErrorIcon();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-1 flex items-center justify-center px-6"
        >
            <div className="text-center space-y-4 max-w-md">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <ErrorIcon className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-xl font-semibold text-foreground">
                        {error}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {error === "Search not found" &&
                            "This search doesn't exist or has been deleted."}
                        {error === "Access denied" &&
                            "You don't have permission to view this search."}
                        {error === "Failed to load search metadata" &&
                            "There was a problem loading the search. Please try again."}
                    </p>
                </div>
                <div className="pt-4">
                    <button
                        onClick={() => window.history.back()}
                        className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
