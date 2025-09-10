import { motion } from "framer-motion";
import {
    MapPinIcon,
    BuildingIcon,
    BookmarkIcon,
    Loader2Icon,
    ExternalLinkIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    AlertTriangleIcon,
} from "lucide-react";
import { SearchResult } from "@/lib/types";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSavedJobs } from "@/hooks/use-saved-jobs";
import { useEffect, useState, useMemo } from "react";
import { Badge } from "../ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

interface JobResultsListProps {
    searchResults: SearchResult[];
}

export function JobResultsList({ searchResults }: JobResultsListProps) {
    const { saveJob, isJobSaved, isLoading, fetchSavedJobs } = useSavedJobs();
    const [currentPage, setCurrentPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<
        "all" | "valid" | "pending" | "invalid" | "partial"
    >("all");
    const itemsPerPage = 10;

    // Sort searchResults by status: VALID > PENDING > INVALID, then by relevance score (highest first)
    const statusPriority = { valid: 0, partial: 1, pending: 2, invalid: 3 };
    const sortedResults = [...searchResults].sort((a, b) => {
        // Lower number = higher priority (valid first)
        const statusDiff =
            (statusPriority[a.status] ?? 3) - (statusPriority[b.status] ?? 3);
        if (statusDiff !== 0) return statusDiff;

        // If status is the same, sort by relevance score (highest first)
        const aScore = a.relevanceScore || 0;
        const bScore = b.relevanceScore || 0;
        return bScore - aScore;
    });

    const statusCounts = useMemo(() => {
        return searchResults.reduce(
            (counts, result) => {
                counts[result.status]++;
                return counts;
            },
            { valid: 0, pending: 0, invalid: 0, partial: 0 }
        );
    }, [searchResults]);

    // Filter results based on status filter
    const filteredResults =
        statusFilter === "all"
            ? sortedResults
            : sortedResults.filter((result) => result.status === statusFilter);

    const totalPages = Math.ceil(filteredResults.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentResults = filteredResults.slice(startIndex, endIndex);

    // Reset to first page when search results change or filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchResults, statusFilter]);

    useEffect(() => {
        fetchSavedJobs();
        console.log(JSON.stringify(searchResults, null, 2));
    }, [fetchSavedJobs]);

    if (!searchResults || searchResults.length === 0) return null;

    const handleSaveJob = async (e: React.MouseEvent, jobId: string) => {
        e.preventDefault();
        e.stopPropagation();
        await saveJob({ jobId });
    };

    const goToPage = (page: number) => {
        setCurrentPage(page);
        // Scroll to top of results
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const goToPreviousPage = () => {
        if (currentPage > 1) {
            goToPage(currentPage - 1);
        }
    };

    const goToNextPage = () => {
        if (currentPage < totalPages) {
            goToPage(currentPage + 1);
        }
    };

    // Generate page numbers for pagination
    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            let start = Math.max(1, currentPage - 2);
            let end = Math.min(totalPages, start + maxVisiblePages - 1);

            if (end - start < maxVisiblePages - 1) {
                start = Math.max(1, end - maxVisiblePages + 1);
            }

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
        }

        return pages;
    };

    const handleStatusFilter = (
        status: "all" | "valid" | "pending" | "invalid" | "partial"
    ) => {
        setStatusFilter(status);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="space-y-4"
        >
            {/* Results Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold tracking-tight text-foreground">
                        Job Results
                    </span>
                    <button
                        onClick={() => handleStatusFilter("all")}
                        className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                            statusFilter === "all"
                                ? "bg-blue-100 text-blue-700 border border-blue-200"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                    >
                        {searchResults.length} found
                    </button>
                    <button
                        onClick={() => handleStatusFilter("valid")}
                        className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                            statusFilter === "valid"
                                ? "bg-green-100 text-green-700 border border-green-200"
                                : "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
                        }`}
                    >
                        {statusCounts.valid} full match
                    </button>
                    {statusCounts.pending > 0 && (
                        <button
                            onClick={() => handleStatusFilter("pending")}
                            className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                                statusFilter === "pending"
                                    ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                                    : "bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100 hover:text-yellow-700 hover:border-yellow-200"
                            }`}
                        >
                            {statusCounts.pending} pending
                        </button>
                    )}
                    {statusCounts.partial > 0 && (
                        <button
                            onClick={() => handleStatusFilter("partial")}
                            className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                                statusFilter === "partial"
                                    ? "bg-cyan-100 text-cyan-800 border border-cyan-200"
                                    : "bg-cyan-50 text-cyan-800 border border-cyan-200 hover:bg-cyan-100"
                            }`}
                        >
                            {statusCounts.partial} partial match
                        </button>
                    )}
                    <button
                        onClick={() => handleStatusFilter("invalid")}
                        className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                            statusFilter === "invalid"
                                ? "bg-orange-100 text-orange-700 border border-orange-200"
                                : "bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100"
                        }`}
                    >
                        {statusCounts.invalid} invalid
                    </button>
                </div>
                <div className="flex items-center gap-2 mt-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Badge
                                variant="outline"
                                className="uppercase tracking-wide text-[11px] px-2 py-0.5 rounded-full border-blue-200 bg-transparent text-blue-600 hover:bg-blue-50/60 transition cursor-pointer font-medium"
                            >
                                <span className="flex items-center gap-1">
                                    Beta
                                </span>
                            </Badge>
                        </PopoverTrigger>
                        <PopoverContent className="max-w-xs rounded-md border border-blue-100 shadow bg-background/95 p-3">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-muted-foreground">
                                    Job results are in <b>beta</b>.
                                    <span className="block text-blue-700 font-medium mt-0.5">
                                        Results may be incomplete or outdated.
                                    </span>
                                    <span className="block mt-0.5">
                                        We&apos;re working to improve accuracy
                                        and coverage.
                                    </span>
                                </span>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {/* Pagination Info */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                        Showing {startIndex + 1}-
                        {Math.min(endIndex, filteredResults.length)} of{" "}
                        {filteredResults.length} results
                        {statusFilter !== "all" && (
                            <span className="text-blue-600 font-medium">
                                {" "}
                                ({statusFilter})
                            </span>
                        )}
                    </span>
                    <span>
                        Page {currentPage} of {totalPages}
                    </span>
                </div>
            )}

            {/* Job List */}
            <div className="space-y-3 flex flex-col w-full">
                {currentResults.map((result) => (
                    <div className="flex flex-col w-full" key={result.id}>
                        {/* Job Card */}
                        <div className="flex flex-col w-full p-3 rounded-lg border border-border/50 bg-card hover:bg-accent hover:border-border transition-all duration-200 overflow-hidden">
                            <div className="space-y-2">
                                {/* Title and Actions */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-base font-semibold leading-tight text-foreground capitalize line-clamp-2 break-words">
                                            {result.job?.title ||
                                                "Job Title Not Available"}
                                        </h3>
                                        <div className="flex items-center gap-2 text-muted-foreground mt-1 min-w-0">
                                            <div className="flex items-center gap-1 min-w-0 flex-shrink">
                                                <BuildingIcon className="w-3.5 h-3.5 flex-shrink-0" />
                                                <span className="text-sm capitalize truncate">
                                                    {result.job?.company ||
                                                        "Company Not Available"}
                                                </span>
                                            </div>
                                            {result.job?.location && (
                                                <>
                                                    <span className="text-muted-foreground/50">
                                                        •
                                                    </span>
                                                    <div className="flex items-center gap-1 min-w-0 flex-shrink">
                                                        <MapPinIcon className="w-3.5 h-3.5 flex-shrink-0" />
                                                        <span className="text-sm capitalize truncate">
                                                            {
                                                                result.job
                                                                    .location
                                                            }
                                                        </span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {result.job?.link && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                asChild
                                                className="h-7 px-2 text-xs"
                                            >
                                                <Link
                                                    href={result.job.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1"
                                                >
                                                    <ExternalLinkIcon className="w-3 h-3" />
                                                    View Listing
                                                </Link>
                                            </Button>
                                        )}
                                        {result.job?.id && (
                                            <Button
                                                variant={
                                                    isJobSaved(result.job.id)
                                                        ? "default"
                                                        : "outline"
                                                }
                                                size="sm"
                                                onClick={(e) =>
                                                    handleSaveJob(
                                                        e,
                                                        result.job!.id
                                                    )
                                                }
                                                disabled={isLoading(
                                                    result.job.id
                                                )}
                                                className="h-7 w-7 p-0"
                                            >
                                                {isLoading(result.job.id) ? (
                                                    <Loader2Icon className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <BookmarkIcon
                                                        className={`w-3 h-3 ${
                                                            isJobSaved(
                                                                result.job.id
                                                            )
                                                                ? "fill-current"
                                                                : ""
                                                        }`}
                                                    />
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Status, Reason, and Source */}
                                <div className="flex items-center gap-2 pt-2 border-t border-border/30 text-xs min-w-0 overflow-hidden">
                                    {/* Animated Status */}
                                    {result.status === "valid" && (
                                        <motion.div
                                            initial={{
                                                opacity: 0,
                                                scale: 0.8,
                                                rotate: -180,
                                            }}
                                            animate={{
                                                opacity: 1,
                                                scale: 1,
                                                rotate: 0,
                                            }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            transition={{
                                                duration: 0.3,
                                                ease: "easeOut",
                                            }}
                                        >
                                            <CheckCircleIcon className="w-3 h-3 text-green-600" />
                                        </motion.div>
                                    )}
                                    {result.status === "invalid" && (
                                        <motion.div
                                            initial={{
                                                opacity: 0,
                                                scale: 0.8,
                                                rotate: -180,
                                            }}
                                            animate={{
                                                opacity: 1,
                                                scale: 1,
                                                rotate: 0,
                                            }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            transition={{
                                                duration: 0.3,
                                                ease: "easeOut",
                                            }}
                                        >
                                            <AlertTriangleIcon className="w-3 h-3 text-orange-600" />
                                        </motion.div>
                                    )}
                                    {result.status === "pending" && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{
                                                opacity: 1,
                                                scale: 1,
                                                rotate: [0, 360],
                                            }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            transition={{
                                                duration: 0.6,
                                                ease: "easeOut",
                                                rotate: {
                                                    repeat: Infinity,
                                                    duration: 2,
                                                    ease: "linear",
                                                },
                                            }}
                                        >
                                            <ClockIcon className="w-3 h-3 text-yellow-600" />
                                        </motion.div>
                                    )}
                                    {result.status === "partial" && (
                                        <motion.div
                                            initial={{
                                                opacity: 0,
                                                scale: 0.8,
                                                rotate: -180,
                                            }}
                                            animate={{
                                                opacity: 1,
                                                scale: 1,
                                                rotate: 0,
                                            }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            transition={{
                                                duration: 0.3,
                                                ease: "easeOut",
                                            }}
                                        >
                                            <AlertTriangleIcon className="w-3 h-3 text-amber-600" />
                                        </motion.div>
                                    )}

                                    <div className="flex-1 min-w-0 max-w-full">
                                        {/* Animated Reason */}
                                        {result.reason && (
                                            <motion.span
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -10 }}
                                                transition={{
                                                    duration: 0.3,
                                                    delay: 0.1,
                                                }}
                                                className="italic text-muted-foreground truncate overflow-hidden whitespace-nowrap flex-1 min-w-0"
                                                title={result.reason}
                                            >
                                                {result.reason}
                                            </motion.span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-border/30">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                        className="flex items-center gap-1"
                    >
                        <ChevronLeftIcon className="w-4 h-4" />
                        Previous
                    </Button>

                    <div className="flex items-center gap-1">
                        {getPageNumbers().map((page) => (
                            <Button
                                key={page}
                                variant={
                                    currentPage === page ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() => goToPage(page)}
                                className="w-8 h-8 p-0"
                            >
                                {page}
                            </Button>
                        ))}
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-1"
                    >
                        Next
                        <ChevronRightIcon className="w-4 h-4" />
                    </Button>
                </div>
            )}
        </motion.div>
    );
}
