import { motion } from "framer-motion";
import { formatRelative } from "date-fns";
import { SearchStatus } from "@/lib/types";
import {
    CheckCircle,
    XCircle,
    Loader2,
    Clock,
    Search,
    Database,
} from "lucide-react";

interface SearchHeaderProps {
    queryText: string;
    searchRecord?: {
        id: string;
        userId: string;
        query: string;
        status: SearchStatus;
        valid: boolean;
        createdAt: string;
    } | null;
    loading: boolean;
    status?: SearchStatus;
    valid?: boolean;
    isPolling?: boolean;
}

export function SearchHeader({
    queryText,
    searchRecord,
    loading,
    status,
    valid,
    isPolling,
}: SearchHeaderProps) {
    // Get the current status from either the record or the passed status
    const currentStatus = searchRecord?.status || status;
    const isValid =
        searchRecord?.valid !== undefined ? searchRecord.valid : valid;

    // Status configuration with icons and colors
    const getStatusConfig = (status: SearchStatus) => {
        switch (status) {
            case "in-progress":
                return {
                    icon: Clock,
                    text: "Initializing search...",
                    color: "text-blue-600",
                    bgColor: "bg-blue-50",
                    borderColor: "border-blue-200",
                };
            case "validating":
                return {
                    icon: Search,
                    text: "Validating query...",
                    color: "text-purple-600",
                    bgColor: "bg-purple-50",
                    borderColor: "border-purple-200",
                };
            case "query":
                return {
                    icon: Database,
                    text: "Searching for jobs...",
                    color: "text-orange-600",
                    bgColor: "bg-orange-50",
                    borderColor: "border-orange-200",
                };
            case "data_validation":
                return {
                    icon: CheckCircle,
                    text: "Validating results...",
                    color: "text-indigo-600",
                    bgColor: "bg-indigo-50",
                    borderColor: "border-indigo-200",
                };
            case "done":
                return isValid
                    ? {
                          icon: CheckCircle,
                          text: "Search completed",
                          color: "text-green-600",
                          bgColor: "bg-green-50",
                          borderColor: "border-green-200",
                      }
                    : {
                          icon: XCircle,
                          text: "Search failed",
                          color: "text-red-600",
                          bgColor: "bg-red-50",
                          borderColor: "border-red-200",
                      };
            default:
                return {
                    icon: Loader2,
                    text: "Processing...",
                    color: "text-gray-600",
                    bgColor: "bg-gray-50",
                    borderColor: "border-gray-200",
                };
        }
    };

    const statusConfig = currentStatus ? getStatusConfig(currentStatus) : null;
    const isSearchProcessing =
        currentStatus && currentStatus !== "done" && isValid !== false;

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border px-6 py-4"
        >
            <div className="flex items-center gap-4">
                <div className="flex-1 flex flex-row w-full justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-foreground mb-2">
                            {queryText}
                        </h1>
                        <div className="flex items-center gap-2 mt-2">
                            {loading && !searchRecord ? (
                                <div className="h-3 w-20 bg-muted animate-pulse rounded"></div>
                            ) : searchRecord ? (
                                <p className="text-xs text-muted-foreground">
                                    Started{" "}
                                    {formatRelative(
                                        new Date(searchRecord.createdAt),
                                        new Date()
                                    )}
                                </p>
                            ) : null}
                        </div>
                    </div>

                    {/* Status Indicator */}
                    {statusConfig && (
                        <div className="flex items-center gap-1">
                            <statusConfig.icon
                                className={`h-4 w-4 ${statusConfig.color} ${
                                    isSearchProcessing ? "animate-spin" : ""
                                }`}
                            />
                            <span className={`text-sm ${statusConfig.color}`}>
                                {statusConfig.text}
                            </span>
                            {isPolling && isSearchProcessing && (
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{
                                        duration: 1,
                                        repeat: Infinity,
                                    }}
                                    className={`w-1 h-1 rounded-full ${statusConfig.color.replace(
                                        "text-",
                                        "bg-"
                                    )}`}
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
