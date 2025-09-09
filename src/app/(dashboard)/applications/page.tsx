"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { BriefcaseIcon, MapPin, Building, ExternalLink, Calendar, Search, Filter } from "lucide-react";
import Link from "next/link";
import { useSavedJobs } from "@/hooks/use-saved-jobs";
import { SavedJob } from "@/lib/saved-jobs";

const statusColors = {
    saved: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
    applied: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
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

const statusOrder = {
    accepted: 1,
    interview: 2,
    applied: 3,
    rejected: 4,
    saved: 5,
};

export default function ApplicationsPage() {
    const { savedJobs, updateSavedJob, isLoading } = useSavedJobs();
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");

    // Filter out jobs that are just "saved" - only show actual applications
    const applications = savedJobs.filter(job => 
        job.applicationStatus !== "saved" || job.appliedAt
    );

    // Apply filters
    const filteredApplications = applications.filter(job => {
        const matchesStatus = filterStatus === "all" || job.applicationStatus === filterStatus;
        const matchesSearch = searchQuery === "" || 
            job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.company.toLowerCase().includes(searchQuery.toLowerCase());
        
        return matchesStatus && matchesSearch;
    });

    // Sort by status priority and then by date
    const sortedApplications = filteredApplications.sort((a, b) => {
        const statusA = statusOrder[a.applicationStatus as keyof typeof statusOrder];
        const statusB = statusOrder[b.applicationStatus as keyof typeof statusOrder];
        
        if (statusA !== statusB) {
            return statusA - statusB;
        }
        
        // If same status, sort by applied date (most recent first)
        const dateA = new Date(a.appliedAt || a.savedAt).getTime();
        const dateB = new Date(b.appliedAt || b.savedAt).getTime();
        return dateB - dateA;
    });

    const handleStatusChange = (jobId: string, newStatus: SavedJob["applicationStatus"]) => {
        const updates: Partial<Pick<SavedJob, "applicationStatus" | "appliedAt">> = {
            applicationStatus: newStatus,
        };
        
        if (newStatus === "applied" && !savedJobs.find(job => job.id === jobId)?.appliedAt) {
            updates.appliedAt = new Date().toISOString();
        }
        
        updateSavedJob(jobId, updates);
    };

    const getStatusCounts = () => {
        const counts = {
            total: applications.length,
            applied: applications.filter(job => job.applicationStatus === "applied").length,
            interview: applications.filter(job => job.applicationStatus === "interview").length,
            accepted: applications.filter(job => job.applicationStatus === "accepted").length,
            rejected: applications.filter(job => job.applicationStatus === "rejected").length,
        };
        return counts;
    };

    const counts = getStatusCounts();

    if (isLoading) {
        return (
            <div className="container mx-auto px-6 py-8 max-w-6xl">
                <div className="text-center">Loading applications...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-6 py-8 max-w-6xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <BriefcaseIcon className="h-6 w-6 text-blue-600" />
                    <h1 className="text-2xl font-semibold">Job Applications</h1>
                    <Badge variant="outline" className="text-sm">
                        {filteredApplications.length} {filteredApplications.length === 1 ? 'application' : 'applications'}
                    </Badge>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">{counts.total}</div>
                        <div className="text-sm text-muted-foreground">Total</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">{counts.applied}</div>
                        <div className="text-sm text-muted-foreground">Applied</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600">{counts.interview}</div>
                        <div className="text-sm text-muted-foreground">Interview</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-emerald-600">{counts.accepted}</div>
                        <div className="text-sm text-muted-foreground">Accepted</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-red-600">{counts.rejected}</div>
                        <div className="text-sm text-muted-foreground">Rejected</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                        placeholder="Search by job title or company..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full sm:w-48">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Applications</SelectItem>
                        <SelectItem value="applied">Applied</SelectItem>
                        <SelectItem value="interview">Interview</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Applications List */}
            {sortedApplications.length === 0 ? (
                <div className="text-center py-12">
                    <BriefcaseIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                        {filterStatus === "all" ? "No applications yet" : `No ${filterStatus} applications`}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                        {filterStatus === "all" 
                            ? "Start applying to jobs to see your applications here."
                            : `You don't have any applications with ${filterStatus} status.`
                        }
                    </p>
                    <Link href="/search">
                        <Button>
                            <Search className="w-4 h-4 mr-2" />
                            Search Jobs
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {sortedApplications.map((application) => (
                        <Card key={application.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-3 mb-3">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg font-semibold leading-tight text-foreground capitalize line-clamp-2 break-words">
                                                    {application.title}
                                                </h3>
                                                <div className="flex items-center gap-2 text-muted-foreground mt-1 min-w-0">
                                                    <div className="flex items-center gap-1 min-w-0 flex-shrink">
                                                        <Building className="w-4 h-4 flex-shrink-0" />
                                                        <span className="text-sm capitalize truncate font-medium">
                                                            {application.company}
                                                        </span>
                                                    </div>
                                                    {application.location && (
                                                        <>
                                                            <span className="text-muted-foreground/50">•</span>
                                                            <div className="flex items-center gap-1 min-w-0 flex-shrink">
                                                                <MapPin className="w-4 h-4 flex-shrink-0" />
                                                                <span className="text-sm capitalize truncate">
                                                                    {application.location}
                                                                </span>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <Badge className={statusColors[application.applicationStatus]}>
                                                {statusLabels[application.applicationStatus]}
                                            </Badge>
                                        </div>

                                        {application.description && (
                                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                                {application.description}
                                            </p>
                                        )}

                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            {application.appliedAt && (
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    <span>Applied {new Date(application.appliedAt).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                            <span>Saved {new Date(application.savedAt).toLocaleDateString()}</span>
                                            {application.source && <span>via {application.source}</span>}
                                        </div>

                                        {application.notes && (
                                            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                                    <strong>Notes:</strong> {application.notes}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-3 flex-shrink-0">
                                        <Select
                                            value={application.applicationStatus}
                                            onValueChange={(value) => handleStatusChange(application.id, value as SavedJob["applicationStatus"])}
                                        >
                                            <SelectTrigger className="w-32 h-9 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="applied">Applied</SelectItem>
                                                <SelectItem value="interview">Interview</SelectItem>
                                                <SelectItem value="rejected">Rejected</SelectItem>
                                                <SelectItem value="accepted">Accepted</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            asChild
                                            className="h-9 px-3 text-xs"
                                        >
                                            <Link
                                                href={application.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1"
                                            >
                                                <ExternalLink className="w-3 h-3" />
                                                View Job
                                            </Link>
                                        </Button>
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
