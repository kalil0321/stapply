"use client";

import { ChatInput } from "@/components/chat-input";
import { motion } from "framer-motion";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { SearchMetadata, SearchResult, SearchStatus } from "@/lib/types";
import {
    SearchHeader,
    SearchErrorState,
    SearchLoadingState,
    SearchMetadataSection,
    JobResultsList,
    SearchEmptyState,
} from "@/components/search";

interface SearchRecord {
    id: string;
    userId: string;
    query: string;
    metadata: SearchMetadata | null;
    websetId: string | null;
    status: SearchStatus;
    valid: boolean;
    createdAt: string;
}

interface SearchResponse {
    metadata: SearchMetadata | null;
    status: SearchStatus;
    valid: boolean;
    results: SearchResult[];
    totalResults: number;
}

export default function QueryPage() {
    const [inputValue, setInputValue] = useState("");
    const [searchRecord, setSearchRecord] = useState<SearchRecord | null>(null);
    const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(
        null
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLiveUpdating, setIsLiveUpdating] = useState(false);

    const searchParams = useSearchParams();
    const { id } = useParams();
    const searchId = Array.isArray(id) ? id[0] : id;
    const eventSourceRef = useRef<EventSource | null>(null);
    const fallbackIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Always get query from URL for immediate display
    const queryText = searchParams.get("q") || "Search query";

    const applySearchData = useCallback(
        (data: SearchResponse) => {
            setSearchResponse(data);
            setError(null);
            if (searchId) {
                setSearchRecord({
                    id: searchId,
                    userId: "",
                    query: queryText,
                    metadata: data.metadata,
                    websetId: null,
                    status: data.status,
                    valid: data.valid,
                    createdAt: new Date().toISOString(),
                });
            }
        },
        [searchId, queryText]
    );

    const fetchSearchData = useCallback(async () => {
        if (!searchId) return null;
        const response = await fetch(`/api/searches/${searchId}`, {
            cache: "no-store",
        });

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error("Search not found");
            }
            if (response.status === 403) {
                throw new Error("Access denied");
            }
            throw new Error("Failed to load search data");
        }

        const data: SearchResponse = await response.json();
        return data;
    }, [searchId]);

    useEffect(() => {
        let isMounted = true;

        const loadInitialData = async () => {
            if (!searchId) return;
            setLoading(true);
            setError(null);

            try {
                const data = await fetchSearchData();
                if (isMounted && data) {
                    applySearchData(data);
                }
            } catch (fetchError) {
                if (!isMounted) return;
                if (fetchError instanceof Error) {
                    setError(fetchError.message);
                } else {
                    setError("Failed to load search data");
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadInitialData();

        return () => {
            isMounted = false;
        };
    }, [searchId, fetchSearchData, applySearchData]);

    const stopFallbackPolling = useCallback(() => {
        if (fallbackIntervalRef.current) {
            clearInterval(fallbackIntervalRef.current);
            fallbackIntervalRef.current = null;
        }
    }, []);

    const startFallbackPolling = useCallback(() => {
        if (fallbackIntervalRef.current) {
            return;
        }

        setIsLiveUpdating(true);
        fallbackIntervalRef.current = setInterval(async () => {
            try {
                const data = await fetchSearchData();
                if (data) {
                    applySearchData(data);
                    if (data.status === "done" || data.valid === false) {
                        stopFallbackPolling();
                        setIsLiveUpdating(false);
                    }
                }
            } catch (pollError) {
                console.error("Fallback polling failed", pollError);
            }
        }, 2000);
    }, [applySearchData, fetchSearchData, stopFallbackPolling]);

    useEffect(() => {
        if (!searchId) {
            return;
        }

        if (typeof window === "undefined" || !("EventSource" in window)) {
            startFallbackPolling();
            return () => {
                stopFallbackPolling();
                setIsLiveUpdating(false);
            };
        }

        let isActive = true;
        const source = new EventSource(`/api/searches/${searchId}/events`);
        eventSourceRef.current = source;

        source.onopen = () => {
            if (!isActive) return;
            setIsLiveUpdating(true);
            stopFallbackPolling();
        };

        source.onmessage = (event) => {
            if (!isActive) return;

            try {
                const data: SearchResponse = JSON.parse(event.data);
                applySearchData(data);
                setLoading(false);

                if (data.status === "done" || data.valid === false) {
                    setIsLiveUpdating(false);
                    stopFallbackPolling();
                    source.close();
                    eventSourceRef.current = null;
                }
            } catch (parseError) {
                console.error("Failed to parse search event payload", parseError);
            }
        };

        source.onerror = () => {
            if (!isActive) return;

            source.close();
            eventSourceRef.current = null;
            setIsLiveUpdating(false);
            fetchSearchData()
                .then((data) => {
                    if (data) {
                        applySearchData(data);
                    }
                })
                .catch((pollError) => {
                    console.error(
                        "Failed to fetch search data after SSE error",
                        pollError
                    );
                });
            startFallbackPolling();
        };

        return () => {
            isActive = false;
            source.close();
            eventSourceRef.current = null;
            setIsLiveUpdating(false);
            stopFallbackPolling();
        };
    }, [
        searchId,
        applySearchData,
        fetchSearchData,
        startFallbackPolling,
        stopFallbackPolling,
    ]);

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        // TODO: Create new search with the input value
        console.log("New query:", inputValue);
    };

    // Check if search is still processing
    const isSearchProcessing = () => {
        return (
            searchResponse?.status !== "done" && searchResponse?.valid !== false
        );
    };

    // Render normal content
    const renderNormalContent = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="px-6 py-4 flex-1 flex flex-col gap-6"
        >
            <div className="flex-1 space-y-8 mx-auto w-full">
                {/* Error state for invalid search */}
                {searchResponse?.valid === false && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <span className="text-red-800 font-medium">
                            Search query could not be processed. Please try a
                            different search.
                        </span>
                    </div>
                )}

                {/* Metadata Section */}
                {searchResponse?.metadata && (
                    <SearchMetadataSection metadata={searchResponse.metadata} />
                )}

                {/* Job Results Section */}
                {searchResponse?.results && (
                    <JobResultsList searchResults={searchResponse.results} />
                )}

                {/* Empty State */}
                {searchResponse?.status === "done" &&
                    searchResponse?.valid &&
                    (!searchResponse?.results ||
                        searchResponse.results.length === 0) && (
                        <SearchEmptyState />
                    )}
            </div>
        </motion.div>
    );

    return (
        <div className="flex-1 flex flex-col h-full w-full">
            {/* Header - Always visible */}
            <SearchHeader
                queryText={queryText}
                searchRecord={searchRecord}
                loading={loading || isSearchProcessing()}
                status={searchResponse?.status}
                valid={searchResponse?.valid}
                isPolling={isLiveUpdating}
            />

            {/* Content - Changes based on state */}
            {error ? (
                <SearchErrorState error={error} />
            ) : loading && !searchResponse ? (
                <SearchLoadingState />
            ) : (
                renderNormalContent()
            )}
        </div>
    );
}
