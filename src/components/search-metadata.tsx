import React from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface SearchMetadataProps {
    data: {
        query: {
            valid: boolean;
            suggestion: string | null;
            reasoning: string | null;
        };
        filters: {
            name: string;
            value: string;
        }[];
        enrichments: {
            field: string;
            description: string;
        }[];
    } | null;
    isLoading?: boolean;
}

export const SearchMetadata: React.FC<SearchMetadataProps> = ({
    data,
    isLoading = false,
}) => {
    if (isLoading) {
        return (
            <ScrollArea className="flex flex-row gap-2 w-full py-1">
                {/* Animated analyzing text */}
                <div className="flex items-center gap-1 mt-1">
                    <span className="text-muted-foreground text-xs">
                        Analyzing query
                    </span>
                    <span className="text-muted-foreground text-xs animate-bounce">
                        .
                    </span>
                    <span className="text-muted-foreground text-xs animate-bounce delay-100">
                        .
                    </span>
                    <span className="text-muted-foreground text-xs animate-bounce delay-200">
                        .
                    </span>
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        );
    }

    if (!data) {
        return null;
    }

    const { query, filters, enrichments } = data;

    return (
        <ScrollArea className="flex flex-row gap-2 w-full">
            {/* Query Validation */}
            <div className="flex flex-row items-center gap-3 w-full py-1">
                {!query.valid && (
                    <Badge
                        variant="destructive"
                        className="bg-gradient-to-r from-red-500 to-red-600  shadow-sm"
                    >
                        Invalid Query
                    </Badge>
                )}
                {!query.valid && query.suggestion && (
                    <span className="text-sm text-muted-foreground">
                        {query.suggestion}
                    </span>
                )}
                {!query.valid && query.reasoning && (
                    <span className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">
                            Reason:
                        </span>{" "}
                        {query.reasoning}
                    </span>
                )}

                {filters.length > 0 &&
                    filters.map((filter, idx) => (
                        <Badge
                            key={idx}
                            variant="outline"
                            className="px-2 py-0.5 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-blue-200 dark:border-blue-800"
                        >
                            <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                                {filter.name}
                            </span>
                            <span className="mx-1 text-blue-500 dark:text-blue-400">
                                :
                            </span>
                            <span className="text-xs text-blue-800 dark:text-blue-200">
                                {filter.value}
                            </span>
                        </Badge>
                    ))}

                {enrichments.length > 0 &&
                    enrichments.map((enrichment, idx) => (
                        <span
                            key={idx}
                            className="flex items-center gap-1 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 
                             rounded-lg px-2 py-0.5 border border-amber-200/50 dark:border-amber-800/50 transition-all duration-200 shadow-sm"
                        >
                            <Badge
                                variant="secondary"
                                className="shrink-0 bg-gradient-to-r from-amber-200 to-yellow-200 dark:from-amber-800 dark:to-yellow-800 text-amber-800 dark:text-amber-200 border-0"
                            >
                                {enrichment.field}
                            </Badge>
                            <span className="text-xs text-amber-700 dark:text-amber-300">
                                {enrichment.description}
                            </span>
                        </span>
                    ))}
            </div>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
    );
};
