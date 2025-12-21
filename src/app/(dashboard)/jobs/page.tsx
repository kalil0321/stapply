"use client";

import { useState, useEffect, useDeferredValue, useMemo, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
    BriefcaseIcon,
    RefreshCwIcon,
    AlertCircleIcon,
    ExternalLinkIcon,
    BookmarkIcon,
    BookmarkCheckIcon,
} from "lucide-react";
import { Job } from "@/lib/types";
import { useVirtualizer } from "@tanstack/react-virtual";
import { toast } from "sonner";

interface JobsResponse {
    jobs: Job[];
    total: number;
    page: number;
    pageSize: number;
    cached: boolean;
}

export default function JobsPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastFetched, setLastFetched] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [total, setTotal] = useState(0);
    const pageSize = 250;
    const [query, setQuery] = useState("");
    const [location, setLocation] = useState("");
    const [company, setCompany] = useState("");
    const deferredQuery = useDeferredValue(query);
    const deferredLocation = useDeferredValue(location);
    const deferredCompany = useDeferredValue(company);
    const listRef = useRef<HTMLDivElement | null>(null);
    const hasFetchedOnceRef = useRef(false);
    const jobsCountLabel = total || jobs.length;
    const canLoadMore = jobs.length < total;
    const [savedJobLinks, setSavedJobLinks] = useState<Set<string>>(new Set());
    const [savingJobs, setSavingJobs] = useState<Set<string>>(new Set());

    const fetchSavedJobLinks = useCallback(async () => {
        try {
            const response = await fetch("/api/saved-jobs/external");
            if (response.ok) {
                const data = await response.json();
                setSavedJobLinks(new Set(data.savedJobLinks || []));
            }
        } catch (err) {
            console.error("Failed to fetch saved jobs:", err);
        }
    }, []);

    const fetchJobs = useCallback(async (nextPage = 0, showRefreshing = false) => {
        try {
            if (showRefreshing) {
                setIsRefreshing(true);
            } else {
                setIsLoading(true);
            }
            setError(null);

            const params = new URLSearchParams({
                page: String(nextPage),
                limit: String(pageSize),
            });
            if (deferredQuery.trim()) {
                params.set("q", deferredQuery.trim());
            }
            if (deferredLocation.trim()) {
                params.set("location", deferredLocation.trim());
            }
            if (deferredCompany.trim()) {
                params.set("company", deferredCompany.trim());
            }

            const response = await fetch(
                `/api/jobs/external?${params.toString()}`
            );
            if (!response.ok) {
                throw new Error("Failed to fetch jobs");
            }

            const data: JobsResponse = await response.json();
            setJobs((prev) =>
                nextPage === 0 ? data.jobs : [...prev, ...data.jobs]
            );
            setPage(data.page);
            setTotal(data.total);
            setLastFetched(new Date().toLocaleString());
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load jobs");
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [pageSize, deferredQuery, deferredLocation, deferredCompany]);

    const saveJob = async (job: Job) => {
        if (savingJobs.has(job.link)) return;

        setSavingJobs((prev) => new Set(prev).add(job.link));

        try {
            const response = await fetch("/api/saved-jobs/external", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jobData: {
                        title: job.title,
                        company: job.company,
                        location: job.location,
                        link: job.link,
                        description: job.description,
                        employmentType: job.employmentType,
                    },
                }),
            });

            if (response.ok) {
                setSavedJobLinks((prev) => new Set(prev).add(job.link));
                toast.success(`Saved ${job.title} at ${job.company}`);
            } else {
                const data = await response.json();
                throw new Error(data.error || "Failed to save job");
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to save job");
        } finally {
            setSavingJobs((prev) => {
                const next = new Set(prev);
                next.delete(job.link);
                return next;
            });
        }
    };

    useEffect(() => {
        fetchSavedJobLinks();
    }, [fetchSavedJobLinks]);

    useEffect(() => {
        const handle = setTimeout(() => {
            fetchJobs(0, hasFetchedOnceRef.current);
            hasFetchedOnceRef.current = true;
        }, 200);

        return () => clearTimeout(handle);
    }, [fetchJobs]);

    const rowVirtualizer = useVirtualizer({
        count: jobs.length,
        getScrollElement: () => listRef.current,
        estimateSize: () => 40,
        overscan: 10,
    });

    const virtualItems = rowVirtualizer.getVirtualItems();
    const totalSize = rowVirtualizer.getTotalSize();
    const jobRows = useMemo(() => jobs, [jobs]);

    // Infinite scroll using TanStack Virtual's recommended approach
    useEffect(() => {
        const [lastItem] = [...virtualItems].reverse();

        if (!lastItem) return;

        if (
            lastItem.index >= jobs.length - 1 &&
            canLoadMore &&
            !isRefreshing
        ) {
            fetchJobs(page + 1, true);
        }
    }, [
        canLoadMore,
        isRefreshing,
        page,
        fetchJobs,
        jobs.length,
        virtualItems,
    ]);


    if (isLoading) {
        return (
            <div className="flex flex-col gap-2 p-4">
                <div className="flex items-center justify-between border-b border-border pb-2">
                    <div>
                        <h1 className="text-lg font-medium">All Jobs</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Loading jobs...
                        </p>
                    </div>
                    <Button variant="outline" size="sm" disabled>
                        <RefreshCwIcon className="size-3.5" />
                        Refresh
                    </Button>
                </div>

                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-24 w-full rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col gap-2 p-4">
                <div className="flex items-center justify-between border-b border-border pb-2">
                    <div>
                        <h1 className="text-lg font-medium">All Jobs</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Error loading jobs
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchJobs(0, true)}
                        disabled={isRefreshing}
                    >
                        <RefreshCwIcon className={`size-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? 'Refreshing...' : 'Try Again'}
                    </Button>
                </div>

                <div className="text-center py-8">
                    <AlertCircleIcon className="size-8 text-red-500 mx-auto mb-2" />
                    <h3 className="text-base font-medium mb-1">Error Loading Jobs</h3>
                    <p className="text-sm text-muted-foreground mb-3">{error}</p>
                    <Button size="sm" onClick={() => fetchJobs(0, true)}>
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2 p-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-2">
                <div>
                    <h1 className="text-lg font-medium">All Jobs</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {jobsCountLabel} jobs found
                        {lastFetched && (
                            <span className="ml-2 text-xs text-muted-foreground/70">
                                Updated: {lastFetched}
                            </span>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchJobs(0, true)}
                        disabled={isRefreshing}
                    >
                        <RefreshCwIcon className={`size-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? 'Refreshing...' : 'Refresh'}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        asChild
                    >
                        <a
                            href="https://map.stapply.ai"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2"
                        >
                            <ExternalLinkIcon className="size-4" />
                            View Map
                        </a>
                    </Button>
                </div>
            </div>

            <div className="grid gap-2 md:grid-cols-3">
                <Input
                    placeholder="Search title, company, location"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="h-9 text-sm"
                />
                <Input
                    placeholder="Filter by location"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    className="h-9 text-sm"
                />
                <div className="flex gap-2">
                    <Input
                        placeholder="Filter by company"
                        value={company}
                        onChange={(event) => setCompany(event.target.value)}
                        className="h-9 text-sm"
                    />
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setQuery("");
                            setLocation("");
                            setCompany("");
                        }}
                    >
                        Clear
                    </Button>
                </div>
            </div>

            {/* Jobs List */}
            {jobs.length > 0 ? (
                <>
                    <div
                        ref={listRef}
                        className="h-[calc(100vh-280px)] overflow-auto"
                    >
                        <div
                            style={{
                                height: `${totalSize}px`,
                                width: "100%",
                                position: "relative",
                            }}
                        >
                            {virtualItems.map((virtualRow) => {
                                const job = jobRows[virtualRow.index];
                                const isSaved = savedJobLinks.has(job.link);
                                const isSaving = savingJobs.has(job.link);

                                let salary = "Not specified";
                                if (job.salaryMin && job.salaryMax) {
                                    salary = `$${Math.round(job.salaryMin).toLocaleString()} - $${Math.round(job.salaryMax).toLocaleString()}`;
                                } else if (job.salaryMin) {
                                    salary = `$${Math.round(job.salaryMin).toLocaleString()}+`;
                                } else if (job.salaryMax) {
                                    salary = `Up to $${Math.round(job.salaryMax).toLocaleString()}`;
                                }

                                return (
                                    <div
                                        key={job.id}
                                        data-index={virtualRow.index}
                                        ref={rowVirtualizer.measureElement}
                                        className="absolute left-0 right-0 border-b border-border hover:bg-muted/30 transition-colors"
                                        style={{
                                            transform: `translateY(${virtualRow.start}px)`,
                                            height: `${virtualRow.size}px`,
                                        }}
                                    >
                                        <div className="flex items-center justify-between gap-3 px-4 py-1.5">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2.5 overflow-hidden">
                                                    <a
                                                        href={job.link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="font-medium text-foreground hover:underline truncate leading-tight flex-shrink-0"
                                                    >
                                                        {job.title}
                                                    </a>
                                                    <span className="text-muted-foreground hidden sm:inline flex-shrink-0">•</span>
                                                    <span className="text-muted-foreground hidden sm:inline truncate min-w-0">
                                                        {job.company}
                                                    </span>
                                                    <span className="text-muted-foreground hidden md:inline flex-shrink-0">•</span>
                                                    <span className="text-muted-foreground hidden md:inline truncate min-w-0">
                                                        {job.location || "Remote"}
                                                    </span>
                                                    <span className="text-muted-foreground hidden lg:inline flex-shrink-0">•</span>
                                                    <span className="text-muted-foreground text-sm hidden lg:inline truncate min-w-0">
                                                        {salary}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 sm:hidden leading-tight mt-0.5">
                                                    <span className="text-sm text-muted-foreground truncate">
                                                        {job.company}
                                                    </span>
                                                    <span className="text-muted-foreground">•</span>
                                                    <span className="text-sm text-muted-foreground truncate">
                                                        {job.location || "Remote"}
                                                    </span>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="shrink-0 h-7 w-7 -mr-1"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    if (!isSaved) saveJob(job);
                                                }}
                                                disabled={isSaved || isSaving}
                                            >
                                                {isSaved ? (
                                                    <BookmarkCheckIcon className="size-3.5 text-primary fill-primary" />
                                                ) : (
                                                    <BookmarkIcon className="size-3.5" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    {isRefreshing && canLoadMore && (
                        <div className="flex justify-center py-2">
                            <RefreshCwIcon className="size-4 animate-spin text-muted-foreground" />
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-8">
                    <BriefcaseIcon className="size-8 text-muted-foreground mx-auto mb-2" />
                    <h3 className="text-base font-medium mb-1">No Jobs Found</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                        There are currently no jobs available. Please try refreshing later.
                    </p>
                    <Button size="sm" onClick={() => fetchJobs(0, true)} disabled={isRefreshing}>
                        <RefreshCwIcon className={`size-3.5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? 'Refreshing...' : 'Refresh Jobs'}
                    </Button>
                </div>
            )}
        </div>
    );
}
