"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    SearchIcon,
    MapPinIcon,
    BookmarkIcon,
    ClockIcon,
    BuildingIcon,
    Loader2Icon,
    ExternalLinkIcon,
    TrashIcon,
    PlusIcon,
    RocketIcon,
} from "lucide-react";
import { useSavedJobs } from "@/hooks/use-saved-jobs";
import { useEffect, useState } from "react";
import { SavedJob } from "@/lib/types";
import Link from "next/link";
import { ApplicationSheet } from "@/components/application-sheet";
import { AddExternalJobDialog } from "@/components/add-external-job-dialog";

export default function SavedJobsPage() {
    const { fetchSavedJobs, removeJob, isLoading } = useSavedJobs();
    const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [showApplicationSheet, setShowApplicationSheet] = useState(false);
    const [selectedJob, setSelectedJob] = useState<SavedJob | null>(null);
    const [showAddJobDialog, setShowAddJobDialog] = useState(false);
    const [isLocal, setIsLocal] = useState(false);

    useEffect(() => {
        const loadSavedJobs = async () => {
            setLoading(true);
            const jobs = await fetchSavedJobs();
            setSavedJobs(jobs || []);
            setLoading(false);
        };
        loadSavedJobs();
    }, [fetchSavedJobs]);

    const handleRemoveJob = async (savedJobId: string, jobId: string) => {
        const success = await removeJob(savedJobId, jobId);
        if (success) {
            setSavedJobs((prev) => prev.filter((job) => job.id !== savedJobId));
        }
    };

    const handleApplyClick = (savedJob: SavedJob, isLocal: boolean) => {
        setSelectedJob(savedJob);
        setShowApplicationSheet(true);
        setIsLocal(isLocal);
    };

    const handleJobAdded = async () => {
        // Refresh the saved jobs list
        const jobs = await fetchSavedJobs();
        setSavedJobs(jobs || []);
    };

    const stats = {
        total: savedJobs.length,
        thisWeek: savedJobs.filter(
            (job) =>
                new Date(job.createdAt) >
                new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length,
    };

    if (loading) {
        return (
            <div className="flex flex-col gap-8 p-6">
                {/* Header Skeleton */}
                <div className="flex items-end justify-between border-b border-border pb-4">
                    <div>
                        <Skeleton className="h-7 w-32 mb-2" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-9 w-20" />
                        <Skeleton className="h-9 w-24" />
                    </div>
                </div>

                {/* Job Cards Skeleton */}
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i} className="w-full">
                            <CardContent className="px-4">
                                <div className="flex items-start justify-between gap-4 w-full">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="flex-1 min-w-0">
                                                {/* Title and Badge */}
                                                <div className="flex items-center gap-3 mb-2 w-full">
                                                    <Skeleton className="h-5 w-48" />
                                                    <Skeleton className="h-5 w-16" />
                                                </div>

                                                {/* Company and Location */}
                                                <div className="flex items-center gap-4 mb-2">
                                                    <div className="flex items-center gap-1.5">
                                                        <Skeleton className="size-4" />
                                                        <Skeleton className="h-4 w-32" />
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Skeleton className="size-4" />
                                                        <Skeleton className="h-4 w-24" />
                                                    </div>
                                                </div>

                                                {/* Date and Employment Type */}
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-1">
                                                        <Skeleton className="size-3" />
                                                        <Skeleton className="h-3 w-20" />
                                                    </div>
                                                    <Skeleton className="h-5 w-16" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <Skeleton className="h-9 w-24" />
                                        <Skeleton className="h-9 w-16" />
                                        <Skeleton className="h-9 w-20" />
                                        <Skeleton className="h-9 w-9" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 p-6">
            {/* Header */}
            <div className="flex items-end justify-between border-b border-border pb-4">
                <div>
                    <h1 className="text-xl font-medium">Saved Jobs</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {stats.total} saved jobs
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => setShowAddJobDialog(true)}
                    >
                        <PlusIcon className="size-4" />
                        Add Job
                    </Button>
                    <Button size="sm" className="gap-2" asChild>
                        <Link href="/search">
                            <SearchIcon className="size-4" />
                            Search Jobs
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Empty State */}
            {savedJobs.length === 0 && (
                <div className="text-center py-12">
                    <BookmarkIcon className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                        No saved jobs yet
                    </h3>
                    <p className="text-muted-foreground mb-4">
                        Start saving jobs from your search results or add jobs
                        from external sources
                    </p>
                    <div className="flex items-center justify-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowAddJobDialog(true)}
                        >
                            <PlusIcon className="w-4 h-4 mr-2" />
                            Add Job
                        </Button>
                        <Button asChild>
                            <Link href="/search">
                                <SearchIcon className="w-4 h-4 mr-2" />
                                Search Jobs
                            </Link>
                        </Button>
                    </div>
                </div>
            )}

            {/* Saved Jobs List */}
            {savedJobs.length > 0 && (
                <div className="space-y-4">
                    <div className="space-y-3">
                        {savedJobs.map((savedJob) => (
                            <Card
                                key={savedJob.id}
                                className="group hover:shadow-sm transition-shadow w-full"
                            >
                                <CardContent className="px-4 w-full">
                                    <div className="flex items-start justify-between gap-4 w-full">
                                        <div className="flex-1 min-w-0 overflow-hidden">
                                            <div className="flex items-start gap-3 mb-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-2 w-full">
                                                        <h3 className="text-base font-semibold leading-tight text-foreground capitalize line-clamp-2 break-words">
                                                            {savedJob.job
                                                                ?.title ||
                                                                "Job Title Not Available"}
                                                        </h3>
                                                        <Badge
                                                            variant="outline"
                                                            className="text-xs flex-shrink-0"
                                                        >
                                                            {savedJob.status}
                                                        </Badge>
                                                    </div>

                                                    <div className="flex items-center gap-4 text-muted-foreground mb-2 flex-wrap">
                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                            <BuildingIcon className="w-4 h-4 flex-shrink-0" />
                                                            <span className="text-sm truncate">
                                                                {savedJob.job
                                                                    ?.company ||
                                                                    "Company Not Available"}
                                                            </span>
                                                        </div>
                                                        {savedJob.job
                                                            ?.location && (
                                                            <div className="flex items-center gap-1.5 min-w-0">
                                                                <MapPinIcon className="w-4 h-4 flex-shrink-0" />
                                                                <span className="text-sm truncate">
                                                                    {
                                                                        savedJob
                                                                            .job
                                                                            .location
                                                                    }
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                                                        <div className="flex items-center gap-1 flex-shrink-0">
                                                            <ClockIcon className="size-3" />
                                                            <span>
                                                                Saved{" "}
                                                                {new Date(
                                                                    savedJob.createdAt
                                                                ).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        {savedJob.job
                                                            ?.employment_type && (
                                                            <Badge
                                                                variant="outline"
                                                                className="text-xs flex-shrink-0"
                                                            >
                                                                {
                                                                    savedJob.job
                                                                        .employment_type
                                                                }
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    {savedJob.notes && (
                                                        <div className="mt-2 p-2 bg-muted/50 rounded text-xs overflow-hidden">
                                                            <span className="font-medium">
                                                                Notes:{" "}
                                                            </span>
                                                            <span className="break-words">
                                                                {savedJob.notes}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {savedJob.jobId && process.env.NODE_ENV === "development" && (
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    asChild
                                                    className=""
                                                >
                                                    <Button
                                                    onClick={() =>
                                                        handleApplyClick(savedJob, true)
                                                    }
                                                        className="flex items-center gap-1"
                                                    >
                                                        <RocketIcon className="w-4 h-4" />
                                                        Apply
                                                    </Button>
                                                </Button>
                                            )}
                                            {/* <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    handleApplyClick(savedJob, false)
                                                }
                                            >
                                                Apply
                                            </Button> */}
                                            {savedJob.job?.link && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    asChild
                                                >
                                                    <Link
                                                        href={savedJob.job.link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        <ExternalLinkIcon className="w-4 h-4 mr-2" />
                                                        View Job
                                                    </Link>
                                                </Button>
                                            )}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    handleRemoveJob(
                                                        savedJob.id,
                                                        savedJob.jobId
                                                    )
                                                }
                                                disabled={isLoading(
                                                    savedJob.jobId
                                                )}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                {isLoading(savedJob.jobId) ? (
                                                    <Loader2Icon className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <TrashIcon className="w-4 h-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            <ApplicationSheet
                isOpen={showApplicationSheet}
                onOpenChange={setShowApplicationSheet}
                savedJob={selectedJob}
                isLocal={isLocal}
            />

            <AddExternalJobDialog
                open={showAddJobDialog}
                onOpenChange={setShowAddJobDialog}
                onJobAdded={handleJobAdded}
            />
        </div>
    );
}
