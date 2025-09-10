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
                            <p className="text-sm text-muted-foreground mb-3">
                                {metadata.query.reasoning}
                            </p>
                        )}

                        {metadata.query.suggestion && (
                            <div className="bg-blue-50/50 dark:bg-blue-950/20 border-l-2 border-blue-500 pl-4 py-2">
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    {metadata.query.suggestion}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {metadata.query.enhanced && (
                <div className="flex items-start gap-2 max-w-full">
                    <Brain className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground break-words leading-relaxed max-w-full">
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

            {/* Enrichments */}
            {metadata.enrichments && metadata.enrichments.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <TrendingUpIcon className="w-4 h-4" />
                        Query Enrichments
                    </div>
                    <div className="grid gap-3">
                        {metadata.enrichments.map((enrichment, index) => {
                            // Handle different types of enrichments
                            let field = "";
                            let description = "";

                            if (
                                typeof enrichment === "object" &&
                                enrichment !== null
                            ) {
                                if (
                                    "field" in enrichment &&
                                    "description" in enrichment
                                ) {
                                    field = enrichment.field as string;
                                    description =
                                        enrichment.description as string;
                                } else {
                                    // Fallback for other object structures
                                    field =
                                        Object.keys(enrichment)[0] || "Unknown";
                                    description = JSON.stringify(enrichment);
                                }
                            } else if (typeof enrichment === "string") {
                                try {
                                    const parsed = JSON.parse(enrichment);
                                    if (parsed.field && parsed.description) {
                                        field = parsed.field;
                                        description = parsed.description;
                                    } else {
                                        field = "Enrichment";
                                        description = enrichment;
                                    }
                                } catch {
                                    field = "Enrichment";
                                    description = enrichment;
                                }
                            } else {
                                field = "Unknown";
                                description = "Invalid enrichment format";
                            }

                            const FieldIcon = getFieldIcon(field);
                            const formattedField = formatFieldName(field);

                            return (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{
                                        duration: 0.3,
                                        delay: index * 0.1,
                                    }}
                                    className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex-shrink-0 mt-0.5">
                                        <FieldIcon className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-medium text-foreground">
                                                {formattedField}
                                            </span>
                                            <Badge
                                                variant="secondary"
                                                className="text-xs px-1.5 py-0.5"
                                            >
                                                Enhanced
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            {description}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}
        </motion.div>
    );
}
