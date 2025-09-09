"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bookmark, MapPin, Building, ExternalLink, Trash2, Edit, Send, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useSavedJobs } from "@/hooks/use-saved-jobs";
import { SavedJob } from "@/lib/saved-jobs";
import { useMutation } from "@tanstack/react-query";

const statusColors = {
    saved: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
    applied: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    interview: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
    accepted: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400",
};

const statusLabels = {
    saved: "Saved",
    applied: "Applied",
    interview: "Interview",
    rejected: "Rejected",
    accepted: "Accepted",
};

function ApplyToJobButton({ job, onApplied }: { job: SavedJob; onApplied: () => void }) {
    const applyMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch("/api/apply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jobUrl: job.link,
                    jobTitle: job.title,
                    company: job.company,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to apply");
            }

            return response.json();
        },
        onSuccess: () => {
            onApplied();
        },
    });

    if (job.applicationStatus === "applied" || job.applicationStatus === "interview" || job.applicationStatus === "accepted") {
        return (
            <Button
                variant="outline"
                size="sm"
                disabled
                className="h-8 px-2 text-xs bg-green-50 text-green-700 border-green-200"
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
            onClick={() => applyMutation.mutate()}
            disabled={applyMutation.isPending}
            className="h-8 px-2 text-xs bg-blue-600 hover:bg-blue-700"
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

export default function SavedJobsPage() {
    const { savedJobs, unsaveJob, updateSavedJob, isLoading } = useSavedJobs();
    const [filterStatus, setFilterStatus] = useState<string>("all");

    const filteredJobs = filterStatus === "all" 
        ? savedJobs 
        : savedJobs.filter(job => job.applicationStatus === filterStatus);

    const handleStatusChange = (jobId: string, newStatus: SavedJob["applicationStatus"]) => {
        const updates: Partial<Pick<SavedJob, "applicationStatus" | "appliedAt">> = {
            applicationStatus: newStatus,
        };
        
        if (newStatus === "applied") {
            updates.appliedAt = new Date().toISOString();
        }
        
        updateSavedJob(jobId, updates);
    };

    const handleJobApplied = (jobId: string) => {
        handleStatusChange(jobId, "applied");
    };

    const handleDelete = (jobId: string) => {
        if (confirm("Are you sure you want to remove this saved job?")) {
            unsaveJob(jobId);
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto px-6 py-8 max-w-4xl">
                <div className="text-center">Loading saved jobs...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-6 py-8 max-w-4xl">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Bookmark className="h-6 w-6 text-blue-600" />
                    <h1 className="text-2xl font-semibold">Saved Jobs</h1>
                    <Badge variant="outline" className="text-sm">
                        {filteredJobs.length} {filteredJobs.length === 1 ? 'job' : 'jobs'}
                    </Badge>
                </div>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Jobs</SelectItem>
                        <SelectItem value="saved">Saved</SelectItem>
                        <SelectItem value="applied">Applied</SelectItem>
                        <SelectItem value="interview">Interview</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {filteredJobs.length === 0 ? (
                <div className="text-center py-12">
                    <Bookmark className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                        {filterStatus === "all" ? "No saved jobs yet" : `No ${filterStatus} jobs`}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                        {filterStatus === "all" 
                            ? "Start saving jobs from your search results to see them here."
                            : `You don't have any jobs with ${filterStatus} status.`
                        }
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredJobs.map((job) => (
                        <Card key={job.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg font-semibold leading-tight text-foreground capitalize line-clamp-2 break-words">
                                                    {job.title}
                                                </h3>
                                                <div className="flex items-center gap-2 text-muted-foreground mt-1 min-w-0">
                                                    <div className="flex items-center gap-1 min-w-0 flex-shrink">
                                                        <Building className="w-4 h-4 flex-shrink-0" />
                                                        <span className="text-sm capitalize truncate">
                                                            {job.company}
                                                        </span>
                                                    </div>
                                                    {job.location && (
                                                        <>
                                                            <span className="text-muted-foreground/50">•</span>
                                                            <div className="flex items-center gap-1 min-w-0 flex-shrink">
                                                                <MapPin className="w-4 h-4 flex-shrink-0" />
                                                                <span className="text-sm capitalize truncate">
                                                                    {job.location}
                                                                </span>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <Badge className={statusColors[job.applicationStatus]}>
                                                {statusLabels[job.applicationStatus]}
                                            </Badge>
                                        </div>

                                        {job.description && (
                                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                                {job.description}
                                            </p>
                                        )}

                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            <span>Saved {new Date(job.savedAt).toLocaleDateString()}</span>
                                            {job.appliedAt && (
                                                <span>Applied {new Date(job.appliedAt).toLocaleDateString()}</span>
                                            )}
                                            {job.source && <span>via {job.source}</span>}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2 flex-shrink-0">
                                        <div className="flex items-center gap-2">
                                            <Select
                                                value={job.applicationStatus}
                                                onValueChange={(value) => handleStatusChange(job.id, value as SavedJob["applicationStatus"])}
                                            >
                                                <SelectTrigger className="w-28 h-8 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="saved">Saved</SelectItem>
                                                    <SelectItem value="applied">Applied</SelectItem>
                                                    <SelectItem value="interview">Interview</SelectItem>
                                                    <SelectItem value="rejected">Rejected</SelectItem>
                                                    <SelectItem value="accepted">Accepted</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDelete(job.id)}
                                                className="h-8 px-2 text-xs text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <ApplyToJobButton 
                                                job={job} 
                                                onApplied={() => handleJobApplied(job.id)} 
                                            />
                                            
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                asChild
                                                className="h-8 px-2 text-xs"
                                            >
                                                <Link
                                                    href={job.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1"
                                                >
                                                    <ExternalLink className="w-3 h-3" />
                                                    View
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
