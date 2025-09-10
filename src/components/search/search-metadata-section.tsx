import { motion } from "framer-motion";
import {
    CheckCircleIcon,
    XCircleIcon,
    FilterIcon,
    TrendingUpIcon,
    Building2,
    MapPin,
    DollarSign,
    Clock,
    Users,
    Briefcase,
    GraduationCap,
    Zap,
    Brain,
} from "lucide-react";
import { SearchMetadata } from "@/lib/types";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";

interface SearchMetadataSectionProps {
    metadata: SearchMetadata;
}

// Helper function to format field names
const formatFieldName = (field: string): string => {
    // Remove @ symbol and other prefixes
    let formatted = field.replace(/^@/, "").replace(/^_/, "");

    // Convert snake_case to readable format
    formatted = formatted.replace(/_/g, " ");

    // Convert camelCase to readable format
    formatted = formatted.replace(/([A-Z])/g, " $1");

    // Capitalize first letter of each word
    formatted = formatted.replace(/\b\w/g, (l) => l.toUpperCase());

    return formatted.trim();
};

// Helper function to get icon for field
const getFieldIcon = (field: string) => {
    const fieldLower = field.toLowerCase();

    if (fieldLower.includes("company") || fieldLower.includes("organization")) {
        return Building2;
    }
    if (
        fieldLower.includes("location") ||
        fieldLower.includes("city") ||
        fieldLower.includes("country")
    ) {
        return MapPin;
    }
    if (
        fieldLower.includes("salary") ||
        fieldLower.includes("pay") ||
        fieldLower.includes("compensation")
    ) {
        return DollarSign;
    }
    if (
        fieldLower.includes("time") ||
        fieldLower.includes("schedule") ||
        fieldLower.includes("hours")
    ) {
        return Clock;
    }
    if (
        fieldLower.includes("size") ||
        fieldLower.includes("team") ||
        fieldLower.includes("employee")
    ) {
        return Users;
    }
    if (
        fieldLower.includes("role") ||
        fieldLower.includes("position") ||
        fieldLower.includes("job")
    ) {
        return Briefcase;
    }
    if (
        fieldLower.includes("education") ||
        fieldLower.includes("degree") ||
        fieldLower.includes("qualification")
    ) {
        return GraduationCap;
    }

    return Zap; // Default icon
};

export function SearchMetadataSection({
    metadata,
}: SearchMetadataSectionProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
        >
            {/* Query Validation */}
            {!metadata.query.valid && (
                <div className="relative">
                    <div className="pl-6">
                        <div className="flex items-center gap-3 mb-2">
                            {!metadata.query.valid && (
                                <>
                                    <XCircleIcon className="w-4 h-4 text-red-600" />
                                    <span className="text-sm font-medium">
                                        Query Invalid
                                    </span>
                                </>
                            )}
                        </div>

                        {metadata.query.reasoning && (
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-3 overflow-hidden break-words">
                                {metadata.query.reasoning}
                            </p>
                        )}

                        {metadata.query.suggestion && (
                            <div className="bg-blue-50/50 dark:bg-blue-950/20 border-l-2 border-blue-500 pl-4 py-2 overflow-hidden">
                                <p className="text-sm text-blue-700 dark:text-blue-300 line-clamp-3 overflow-hidden break-words">
                                    {metadata.query.suggestion}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {metadata.query.enhanced && (
                <div className="flex items-start gap-2 max-w-full overflow-hidden">
                    <Brain className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground break-words leading-relaxed max-w-full line-clamp-3 overflow-hidden">
                        {metadata.query.enhanced}
                    </p>
                </div>
            )}

            {/* Applied Filters */}
            {metadata.filters && metadata.filters.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <FilterIcon className="w-4 h-4" />
                        Applied Filters
                    </div>
                    <ScrollArea className="w-full">
                        <div className="flex gap-2 pb-2">
                            {metadata.filters.map((filter, index) => (
                                <span
                                    key={index}
                                    className="inline-flex items-center px-3 py-1 text-xs font-medium bg-secondary/50 text-secondary-foreground rounded-full border flex-shrink-0"
                                >
                                    {filter.name}: {filter.value}
                                </span>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            )}
        </motion.div>
    );
}
