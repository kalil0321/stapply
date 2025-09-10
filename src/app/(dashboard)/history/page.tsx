"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    ClockIcon,
    SearchIcon,
    ExternalLinkIcon,
    TrendingUpIcon,
    FilterIcon,
    ZapIcon,
    PlayCircleIcon,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { SearchHistory, SearchMetadata, LiveSearchStatus } from "@/lib/types";
import Link from "next/link";

interface DatabaseSearchRecord {
    id: string;
    userId: string;
    query: string;
    metadata: SearchMetadata | null;
    createdAt: string;
    valid: boolean;
}

const SearchHistorySkeleton = () => (
    <div className="border-b border-border pb-4 mb-4 last:border-b-0">
        <div className="flex items-center justify-between">
            <div className="flex-1 flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-5 w-48" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-3 w-3 rounded" />
                    <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex gap-1">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                </div>
            </div>
            <Skeleton className="h-8 w-8 rounded" />
        </div>
    </div>
);

export default function HistoryPage() {
    const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const fetchHistory = async () => {
        const response = await fetch("/api/searches");
        if (!response.ok) {
            throw new Error(`Failed to fetch search history: ${response.statusText}`);
        }
        const data = await response.json();
        const history: SearchHistory[] = data.searches.map((search: DatabaseSearchRecord) => ({
            id: search.id,
            query: search.query,
            timestamp: new Date(search.createdAt).getTime(),
            metadata: search.metadata,
            createdAt: search.createdAt,
            userId: search.userId,
            valid: search.valid,
        }));
        return history;
    };

    const { data: searchHistoryData, isFetching: fetchingHistory, error: historyError, refetch } = useQuery({
        queryKey: ["searchHistory"],
        queryFn: fetchHistory,
    });

    useEffect(() => {
        if (searchHistoryData) {
            setSearchHistory(searchHistoryData);
        }
        if (historyError instanceof Error) {
            setError(historyError.message);
        }
        setLoading(fetchingHistory);
    }, [searchHistoryData, historyError, fetchingHistory]);

    const handleSearchClick = (search: SearchHistory) => {
        if (search.type === 'live') {
            router.push(
                `/live-search/${search.id}?q=${encodeURIComponent(search.query)}`
            );
        } else {
            router.push(
                `/search/${search.id}?q=${encodeURIComponent(search.query)}`
            );
        }
    };

    const clearHistoryMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch("/api/searches", { method: "DELETE" });
            if (!response.ok) {
                throw new Error("Failed to clear search history");
            }
            return true;
        },
        onSuccess: () => {
            setSearchHistory([]);
        },
        onError: () => {
            setError("Failed to clear search history");
        },
    });

    const clearHistory = async () => {
        if (
            !confirm(
                "Are you sure you want to clear all search history? This action cannot be undone."
            )
        ) {
            return;
        }
        try {
            await clearHistoryMutation.mutateAsync();
        } catch (error) {
            console.error("Error clearing search history:", error);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col h-full w-full">
                <div className="px-6 py-4 border-b border-border">
                    <div className="flex items-center justify-between">
                        <div>
                            <Skeleton className="h-8 w-48 mb-2" />
                            <Skeleton className="h-4 w-64" />
                        </div>
                        <Skeleton className="h-8 w-24" />
                    </div>
                </div>
                <div className="flex-1 px-6 py-4">
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <SearchHistorySkeleton key={i} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col h-full w-full">
                <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                                <ClockIcon className="size-6" />
                                History
                            </h1>
                        </div>
                    </div>
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-red-500 mb-4">{error}</p>
                        <Button
                            onClick={() => window.location.reload()}
                            variant="outline"
                        >
                            Try Again
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <ClockIcon className="size-6" />
                            History
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {searchHistory.length}{" "}
                            {searchHistory.length === 1 ? "search" : "searches"}
                        </p>
                    </div>
                    {searchHistory.length > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={clearHistory}
                            className="text-muted-foreground hover:text-destructive"
                        >
                            Clear History
                        </Button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {searchHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <SearchIcon className="size-16 text-muted-foreground mb-4" />
                        <h2 className="text-xl font-semibold text-foreground mb-2">
                            No Search History Yet
                        </h2>
                        <p className="text-muted-foreground mb-6">
                            Start searching for jobs to see your history here
                        </p>
                        <Button
                            onClick={() => router.push("/")}
                            className="flex items-center gap-2"
                        >
                            <SearchIcon className="size-4" />
                            Start New Search
                        </Button>
                    </div>
                ) : (
                    <div>
                        {searchHistory.map((search) => {
                            const isLiveSearch = search.type === 'live';
                            const searchHref = isLiveSearch 
                                ? `/live-search/${search.id}?q=${encodeURIComponent(search.query)}`
                                : `/search/${search.id}?q=${encodeURIComponent(search.query)}`;
                            
                            return (
                            <Link
                                href={searchHref}
                                key={search.id}
                                className="flex flex-col border-b border-border  group cursor-pointer"
                            >
                                <div className="flex items-center justify-between px-6 py-4 hover:bg-muted/100 transition-colors duration-200 rounded-sm">
                                    <div className="flex-1 flex items-center gap-6 min-w-0">
                                        {/* Search Query */}
                                        <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
                                            {isLiveSearch ? (
                                                <ZapIcon className="size-4 text-primary flex-shrink-0" />
                                            ) : (
                                                <SearchIcon className="size-4 text-muted-foreground flex-shrink-0" />
                                            )}
                                            <h3 className="text-md font-medium text-foreground group-hover:text-primary transition-colors truncate">
                                                {search.query}
                                            </h3>
                                            {isLiveSearch && (
                                                <Badge variant="secondary" className="text-xs">
                                                    Live
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Timestamp */}
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground flex-shrink-0">
                                            <ClockIcon className="size-3" />
                                            <span className="whitespace-nowrap">
                                                {formatDistanceToNow(
                                                    new Date(search.timestamp),
                                                    { addSuffix: true }
                                                )}
                                            </span>
                                        </div>

                                        {/* Metadata - inline */}
                                        {isLiveSearch ? (
                                            // Live search metadata
                                            <div className="flex items-center gap-3 flex-wrap min-w-0">
                                                {/* Status badge for live searches */}
                                                {search.status && (
                                                    <Badge
                                                        variant={
                                                            (search.status as LiveSearchStatus) === 'completed' 
                                                                ? 'default'
                                                                : (search.status as LiveSearchStatus) === 'failed'
                                                                ? 'destructive'
                                                                : (search.status as LiveSearchStatus) === 'in_progress'
                                                                ? 'secondary'
                                                                : 'outline'
                                                        }
                                                        className={`text-xs flex-shrink-0 ${
                                                            (search.status as LiveSearchStatus) === 'completed' ? 'bg-green-500' : ''
                                                        }`}
                                                    >
                                                        {(search.status as LiveSearchStatus) === 'in_progress' ? 'Running' : search.status}
                                                    </Badge>
                                                )}
                                                
                                                {/* Results count */}
                                                {search.results && search.results.length > 0 && (
                                                    <Badge variant="outline" className="text-xs flex-shrink-0">
                                                        {search.results.length} results
                                                    </Badge>
                                                )}
                                                
                                                {/* Error indicator */}
                                                {search.error && (
                                                    <Badge variant="destructive" className="text-xs flex-shrink-0">
                                                        Error
                                                    </Badge>
                                                )}
                                            </div>
                                        ) : (
                                            // Regular search metadata
                                            search.metadata && (
                                                <div className="flex items-center gap-3 flex-wrap min-w-0">
                                                    {search.metadata.query &&
                                                        !search.metadata.query
                                                            .valid && (
                                                            <Badge
                                                                variant="destructive"
                                                                className="text-xs flex-shrink-0"
                                                            >
                                                                Invalid
                                                            </Badge>
                                                        )}

                                                    {/* Filters */}
                                                    {search.metadata.filters &&
                                                        search.metadata.filters
                                                            .length > 0 && (
                                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                                <FilterIcon className="size-3 text-muted-foreground" />
                                                                <div className="flex gap-1">
                                                                    {search.metadata.filters
                                                                        .slice(0, 2)
                                                                        .map(
                                                                            (
                                                                                filter,
                                                                                idx
                                                                            ) => (
                                                                                <Badge
                                                                                    key={
                                                                                        idx
                                                                                    }
                                                                                    variant="outline"
                                                                                    className="text-xs"
                                                                                >
                                                                                    {
                                                                                        filter.name
                                                                                    }
                                                                                    :{" "}
                                                                                    {
                                                                                        filter.value
                                                                                    }
                                                                                </Badge>
                                                                            )
                                                                        )}
                                                                    {search.metadata
                                                                        .filters
                                                                        .length > 2 && (
                                                                        <Badge
                                                                            variant="outline"
                                                                            className="text-xs"
                                                                        >
                                                                            +
                                                                            {search
                                                                                .metadata
                                                                                .filters
                                                                                .length -
                                                                                2}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                    {/* Enrichments */}
                                                    {search.metadata.enrichments &&
                                                        search.metadata.enrichments
                                                            .length > 0 && (
                                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                                <TrendingUpIcon className="size-3 text-muted-foreground" />
                                                                <div className="flex gap-1">
                                                                    {search.metadata.enrichments
                                                                        .slice(0, 2)
                                                                        .map(
                                                                            (
                                                                                enrichment,
                                                                                idx
                                                                            ) => (
                                                                                <Badge
                                                                                    key={
                                                                                        idx
                                                                                    }
                                                                                    variant="secondary"
                                                                                    className="text-xs"
                                                                                >
                                                                                    {
                                                                                        enrichment.field
                                                                                    }
                                                                                </Badge>
                                                                            )
                                                                        )}
                                                                    {search.metadata
                                                                        .enrichments
                                                                        .length > 2 && (
                                                                        <Badge
                                                                            variant="secondary"
                                                                            className="text-xs"
                                                                        >
                                                                            +
                                                                            {search
                                                                                .metadata
                                                                                .enrichments
                                                                                .length -
                                                                                2}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
