"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Building, Clock, ExternalLink, Bookmark, BookmarkCheck, Send, CheckCircle } from "lucide-react";
import { ChatInput } from "@/components/chat-input";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useSavedJobStatus } from "@/hooks/use-saved-jobs";
import { useProfile } from "@/hooks/use-profile";

interface SearchResult {
    id: string;
    title: string;
    company: string;
    location?: string;
    description?: string;
    link: string;
    postedAt?: string;
    source?: string;
    similarityScore?: number;
    relevanceScore?: number;
    status: "pending" | "valid" | "invalid" | "partial";
    reason?: string;
}

interface SearchData {
    id: string;
    query: string;
    status: "in-progress" | "validating" | "query" | "data_validation" | "done";
    valid: boolean;
    description?: string;
    results: SearchResult[];
}

function SaveJobButton({ job }: { job: SearchResult }) {
    const { isSaved, toggleSaved } = useSavedJobStatus({
        title: job.title,
        company: job.company,
        link: job.link,
    });

    const handleToggleSave = () => {
        const success = toggleSaved();
        if (!success) {
            console.error("Failed to toggle job save status");
        }
    };

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleToggleSave}
            className="h-7 px-2 text-xs"
        >
            {isSaved ? (
                <>
                    <BookmarkCheck className="w-3 h-3 mr-1" />
                    Saved
                </>
            ) : (
                <>
                    <Bookmark className="w-3 h-3 mr-1" />
                    Save
                </>
            )}
        </Button>
    );
}

function ApplyButton({ job }: { job: SearchResult }) {
    const [hasApplied, setHasApplied] = useState(false);
    const { profile, isProfileComplete } = useProfile();

    const applyMutation = useMutation({
        mutationFn: async () => {
            if (!profile || !isProfileComplete()) {
                throw new Error("Please complete your profile before applying to jobs.");
            }

            const response = await fetch("/api/apply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jobUrl: job.link,
                    jobTitle: job.title,
                    company: job.company,
                    profile: {
                        firstName: profile.firstName,
                        lastName: profile.lastName,
                        email: profile.email,
                        phone: profile.phone,
                        resumeFile: profile.resumeFile,
                    },
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to apply");
            }

            return response.json();
        },
        onSuccess: () => {
            setHasApplied(true);
        },
    });

    const handleApply = () => {
        if (hasApplied) return;
        applyMutation.mutate();
    };

    if (hasApplied || applyMutation.isSuccess) {
        return (
            <Button
                variant="outline"
                size="sm"
                disabled
                className="h-7 px-2 text-xs bg-green-50 text-green-700 border-green-200"
            >
                <CheckCircle className="w-3 h-3 mr-1" />
                Applied
            </Button>
        );
    }

    return (
        <Button
            variant="default"
            size="sm"
            onClick={handleApply}
            disabled={applyMutation.isPending}
            className="h-7 px-2 text-xs bg-blue-600 hover:bg-blue-700"
        >
            {applyMutation.isPending ? (
                <>
                    <div className="w-3 h-3 mr-1 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Applying...
                </>
            ) : (
                <>
                    <Send className="w-3 h-3 mr-1" />
                    Apply
                </>
            )}
        </Button>
    );
}

export default function SearchPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const searchId = params.id as string;
    const query = searchParams.get("q") || "";
    
    const [searchData, setSearchData] = useState<SearchData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Search input state
    const [searchValue, setSearchValue] = useState(query);
    const [isSearching, setIsSearching] = useState(false);

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

    const handleSearch = async () => {
        if (!searchValue.trim()) return;

        setIsSearching(true);
        try {
            const data = await createSearchMutation.mutateAsync(searchValue);
            router.push(`/search/${data.id}?q=${encodeURIComponent(searchValue)}`);
        } catch (error) {
            console.error("Error creating search:", error);
        } finally {
            setIsSearching(false);
        }
    };

    useEffect(() => {
        const fetchSearchData = async () => {
            try {
                const response = await fetch(`/api/searches/${searchId}`);
                if (!response.ok) {
                    throw new Error("Failed to fetch search data");
                }
                const data = await response.json();
                setSearchData(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "An error occurred");
            } finally {
                setIsLoading(false);
            }
        };

        if (searchId) {
            fetchSearchData();
            
            // Set up polling for real-time updates
            const interval = setInterval(fetchSearchData, 2000);
            return () => clearInterval(interval);
        }
    }, [searchId]);

    const getStatusColor = (status: string, valid?: boolean) => {
        if (status === "done" && valid === false) {
            return "border-red-200 text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800";
        }
        switch (status) {
            case "done": return "border-green-200 text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800";
            case "in-progress": return "border-blue-200 text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800";
            case "validating": return "border-yellow-200 text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800";
            case "query": return "border-purple-200 text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800";
            case "data_validation": return "border-orange-200 text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800";
            default: return "border-gray-200 text-gray-600 bg-gray-50 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800";
        }
    };

    const getStatusText = (status: string, valid?: boolean) => {
        if (status === "done" && valid === false) {
            return "Search failed";
        }
        switch (status) {
            case "in-progress": return "Initializing search...";
            case "validating": return "Validating query...";
            case "query": return "Searching for jobs...";
            case "data_validation": return "Processing results...";
            case "done": return "Search complete";
            default: return status;
        }
    };

    if (error) {
        return (
            <div className="container mx-auto px-6 py-12 max-w-3xl">
                <div className="text-center">
                    <p className="text-red-500 text-sm">Error: {error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-6 py-8 max-w-3xl">
            {/* Search Bar */}
            <div className="mb-6">
                <ChatInput
                    value={searchValue}
                    setValue={setSearchValue}
                    onSend={handleSearch}
                    isLoading={isSearching}
                />
            </div>

            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Search className="h-5 w-5 text-gray-400" />
                    <h1 className="text-xl font-medium text-gray-900 dark:text-gray-100">
                        Results for "{query}"
                    </h1>
                </div>
                {searchData && (
                    <Badge
                        variant="outline"
                        className={`text-xs ${getStatusColor(searchData.status, searchData.valid)}`}
                    >
                        {getStatusText(searchData.status, searchData.valid)}
                    </Badge>
                )}
            </div>

            {/* Results */}
            <div className="space-y-3">
                {searchData?.results?.map((result) => (
                    <div
                        key={result.id}
                        className="relative p-3 rounded-lg border border-border/50 bg-card hover:bg-accent hover:border-border transition-all duration-200"
                    >
                        <div className="space-y-2">
                            {/* Title and Actions */}
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base font-semibold leading-tight text-foreground capitalize line-clamp-2 break-words">
                                        {result.title || "Job Title Not Available"}
                                    </h3>
                                    <div className="flex items-center gap-2 text-muted-foreground mt-1 min-w-0">
                                        <div className="flex items-center gap-1 min-w-0 flex-shrink">
                                            <Building className="w-3.5 h-3.5 flex-shrink-0" />
                                            <span className="text-sm capitalize truncate">
                                                {result.company || "Company Not Available"}
                                            </span>
                                        </div>
                                        {result.location && (
                                            <>
                                                <span className="text-muted-foreground/50">
                                                    •
                                                </span>
                                                <div className="flex items-center gap-1 min-w-0 flex-shrink">
                                                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                                                    <span className="text-sm capitalize truncate">
                                                        {result.location}
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <SaveJobButton job={result} />
                                    <ApplyButton job={result} />
                                    {result.link && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            asChild
                                            className="h-7 px-2 text-xs"
                                        >
                                            <Link
                                                href={result.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1"
                                            >
                                                <ExternalLink className="w-3 h-3" />
                                                View Listing
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Error state */}
            {searchData?.status === "done" && searchData.valid === false && (
                <div className="text-center py-8">
                    <p className="text-red-500 text-sm">
                        {searchData.description || "An error occurred while processing your search."}
                    </p>
                </div>
            )}

            {/* No results state - only show when search was successful but no results found */}
            {searchData?.status === "done" && searchData.valid === true && (!searchData.results || searchData.results.length === 0) && (
                <div className="text-center py-8">
                    <p className="text-gray-500 text-sm">
                        No results found for this search.
                    </p>
                </div>
            )}
        </div>
    );
}
