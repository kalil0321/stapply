"use client";

import { ChatInput } from "@/components/chat-input";
import { motion } from "framer-motion";
import { useEffect, useState, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
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
    const [isPolling, setIsPolling] = useState(false);

    const searchParams = useSearchParams();
    const { id } = useParams();
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Always get query from URL for immediate display
    const queryText = searchParams.get("q") || "Search query";

    // Fetch search data from API
    const fetchSearchData = useCallback(async () => {
        if (!id) return null;
        const response = await fetch(`/api/searches/${id}`);
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
    }, [id]);

    const {
        data: queryData,
        refetch,
        isFetching,
        error: queryError,
    } = useQuery({
        queryKey: ["search", id],
        queryFn: fetchSearchData,
        enabled: false,
    });

    useEffect(() => {
        if (queryData) {
            setSearchResponse(queryData);
            setSearchRecord({
                id: id as string,
                userId: "",
                query: queryText,
                metadata: queryData.metadata,
                websetId: null,
                status: queryData.status,
                valid: queryData.valid,
                createdAt: new Date().toISOString(),
            });
            if (queryData.status === "done" || !queryData.valid) {
                setIsPolling(false);
            }
        }
        if (queryError instanceof Error) {
            setError(queryError.message);
            setIsPolling(false);
        }
    }, [queryData, queryError, queryText, id]);

    // Start polling
    const startPolling = useCallback(() => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
        }

        setIsPolling(true);
        pollingIntervalRef.current = setInterval(async () => {
            const { data } = await refetch();
            if (data && (data.status === "done" || !data.valid)) {
                setIsPolling(false);
            }
            //TODO: adjust the polling interval based on the number of results
        }, 1000); // Poll every 1 second
    }, [refetch]);

    // Stop polling
    const stopPolling = useCallback(() => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
        setIsPolling(false);
    }, []);

    // Initial fetch and setup polling
    useEffect(() => {
        const initialFetch = async () => {
            setLoading(true);
            setError(null);

            const { data } = await refetch();

            // Start polling if search is still in progress
            if (data && data.status !== "done" && data.valid) {
                startPolling();
            }

            setLoading(false);
        };

        initialFetch();

        // Cleanup polling on unmount
        return () => {
            stopPolling();
        };
    }, [id, refetch, startPolling, stopPolling]);

    // Stop polling when component unmounts or when search is complete
    useEffect(() => {
        if (
            searchResponse?.status === "done" ||
            (searchResponse && !searchResponse.valid)
        ) {
            stopPolling();
        }
    }, [searchResponse?.status, searchResponse?.valid, stopPolling]);

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
                isPolling={isPolling}
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
