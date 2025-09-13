"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
    CalendarIcon,
    ClockIcon,
    ExternalLinkIcon,
    MapPinIcon,
    BriefcaseIcon,
    CheckCircleIcon,
    AlertCircleIcon,
    XCircleIcon,
    PlusCircleIcon,
    MoreHorizontalIcon,
    ArrowRightIcon,
    BookmarkIcon,
    TrashIcon,
} from "lucide-react";
import { useApplications } from "@/hooks/use-applications";
import { AddApplicationDialog } from "@/components/add-application-dialog";
import { DeleteApplicationDialog } from "@/components/delete-application-dialog";

// Helper function to determine status based on application age
const getApplicationStatus = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const daysDiff = Math.floor(
        (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff <= 1) return { status: "applied", label: "Application Sent" };
    if (daysDiff <= 7) return { status: "under_review", label: "Under Review" };
    if (daysDiff <= 30)
        return { status: "interview_scheduled", label: "In Progress" };
    return { status: "pending", label: "Pending Response" };
};

const getStatusIcon = (status: string) => {
    switch (status) {
        case "accepted":
            return <CheckCircleIcon className="size-4 text-green-600" />;
        case "interview_scheduled":
            return <CalendarIcon className="size-4 text-blue-600" />;
        case "under_review":
            return <ClockIcon className="size-4 text-yellow-600" />;
        case "rejected":
            return <XCircleIcon className="size-4 text-red-600" />;
        case "applied":
            return <AlertCircleIcon className="size-4 text-gray-600" />;
        default:
            return <ClockIcon className="size-4 text-gray-600" />;
    }
};

const getStatusColor = (status: string) => {
    switch (status) {
        case "accepted":
            return "bg-green-100 text-green-800 border-green-200";
        case "interview_scheduled":
            return "bg-blue-100 text-blue-800 border-blue-200";
        case "under_review":
            return "bg-yellow-100 text-yellow-800 border-yellow-200";
        case "rejected":
            return "bg-red-100 text-red-800 border-red-200";
        case "applied":
            return "bg-gray-100 text-gray-800 border-gray-200";
        default:
            return "bg-gray-100 text-gray-800 border-gray-200";
    }
};

const getNextStep = (status: string, createdAt: string) => {
    const daysDiff = Math.floor(
        (new Date().getTime() - new Date(createdAt).getTime()) /
            (1000 * 60 * 60 * 24)
    );

    switch (status) {
        case "applied":
            return "Waiting for response";
        case "under_review":
            return "Application being reviewed";
        case "interview_scheduled":
            return "Next step pending";
        default:
            return `Applied ${daysDiff} days ago`;
    }
};

export default function ApplicationsPage() {
    const { applications, isLoading, error, refetchApplications, deleteApplication, isDeleting } =
        useApplications();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [applicationToDelete, setApplicationToDelete] = useState<any>(null);
    const router = useRouter();

    const handleApplicationAdded = () => {
        refetchApplications();
    };

    const handleApplyToSaved = () => {
        router.push("/saved");
    };

    const handleDeleteClick = (application: any) => {
        setApplicationToDelete(application);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (applicationToDelete) {
            await deleteApplication(applicationToDelete.id);
            setDeleteDialogOpen(false);
            setApplicationToDelete(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col gap-4 p-6">
                <div className="flex items-end justify-between border-b border-border pb-4">
                    <div>
                        <h1 className="text-xl font-medium">Applications</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            disabled
                        >
                            <BookmarkIcon className="size-4" />
                            Apply to Saved
                        </Button>
                        <Button size="sm" className="gap-2" disabled>
                            <PlusCircleIcon className="size-4" />
                            Add Application
                        </Button>
                    </div>
                </div>

                <div className="flex items-center justify-between px-4 py-2 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-8">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <Skeleton className="size-3 rounded-full" />
                                <Skeleton className="h-4 w-16" />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-32 w-full rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col gap-4 p-6">
                <div className="flex items-end justify-between border-b border-border pb-4">
                    <div>
                        <h1 className="text-xl font-medium">Applications</h1>
                    </div>
                </div>
                <div className="text-center py-12">
                    <AlertCircleIcon className="size-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                        Error Loading Applications
                    </h3>
                    <p className="text-muted-foreground mb-4">
                        There was an error loading your applications. Please try
                        again.
                    </p>
                    <Button onClick={() => window.location.reload()}>
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    // Transform real data to work with existing UI
    const transformedApplications = applications.map((app: any) => {
        const statusInfo = getApplicationStatus(app.createdAt);
        return {
            id: app.id,
            jobTitle: app.job?.title || "Unknown Position",
            company: app.job?.company || "Unknown Company",
            location: app.job?.location || "Location not specified",
            salary: "Salary not specified", // Not available in current schema
            appliedDate: app.createdAt,
            status: statusInfo.status,
            statusLabel: statusInfo.label,
            jobType: app.job?.employment_type || "Full-time",
            remote: false, // Not available in current schema
            description: app.job?.description || "",
            nextStep: getNextStep(statusInfo.status, app.createdAt),
            applicationUrl: app.job?.link || "#",
            progress:
                statusInfo.status === "applied"
                    ? 25
                    : statusInfo.status === "under_review"
                    ? 50
                    : statusInfo.status === "interview_scheduled"
                    ? 75
                    : 0,
        };
    });

    const stats = {
        total: transformedApplications.length,
        pending: transformedApplications.filter(
            (app: (typeof transformedApplications)[0]) =>
                ["applied", "under_review", "interview_scheduled"].includes(
                    app.status
                )
        ).length,
        offers: transformedApplications.filter(
            (app: (typeof transformedApplications)[0]) =>
                app.status === "accepted"
        ).length,
        rejected: transformedApplications.filter(
            (app: (typeof transformedApplications)[0]) =>
                app.status === "rejected"
        ).length,
    };

    const activeApplications = transformedApplications.filter(
        (app: (typeof transformedApplications)[0]) => app.status !== "rejected"
    );
    const rejectedApplications = transformedApplications.filter(
        (app: (typeof transformedApplications)[0]) => app.status === "rejected"
    );

    return (
        <>
            <div className="flex flex-col gap-4 p-6">
                {/* Subtle Header */}
                <div className="flex items-end justify-between border-b border-border pb-4">
                    <div>
                        <h1 className="text-xl font-medium">Applications</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={handleApplyToSaved}
                        >
                            <BookmarkIcon className="size-4" />
                            Apply to Saved
                        </Button>
                        <Button
                            size="sm"
                            className="gap-2"
                            onClick={() => setIsDialogOpen(true)}
                        >
                            <PlusCircleIcon className="size-4" />
                            Add Application
                        </Button>
                    </div>
                </div>

                {/* Inline Stats Bar */}
                <div className="flex items-center justify-between px-4 py-2 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-2">
                            <div className="size-3 bg-blue-600 rounded-full"></div>
                            <span className="text-sm font-medium">
                                {stats.total} Total
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="size-3 bg-yellow-600 rounded-full"></div>
                            <span className="text-sm font-medium">
                                {stats.pending} In Progress
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="size-3 bg-green-600 rounded-full"></div>
                            <span className="text-sm font-medium">
                                {stats.offers} Offers
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="size-3 bg-red-600 rounded-full"></div>
                            <span className="text-sm font-medium">
                                {stats.rejected} Closed
                            </span>
                        </div>
                    </div>
                </div>

                {/* Active Applications - Table Style */}
                {activeApplications.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-medium">
                                Active Applications
                            </h2>
                            <div className="text-sm text-muted-foreground">
                                {activeApplications.length} applications
                            </div>
                        </div>

                        <div className="space-y-3">
                            {activeApplications.map(
                                (
                                    application: (typeof transformedApplications)[0],
                                    index: number
                                ) => (
                                    <div
                                        key={application.id}
                                        className="group relative cursor-pointer"
                                        onClick={() => router.push(`/application/${application.id}`)}
                                    >
                                        <div className="pl-6 py-4 bg-background border border-border rounded-lg hover:shadow-sm transition-all group-hover:border-muted-foreground/20">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start gap-4">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <h3 className="font-semibold text-lg truncate">
                                                                    {
                                                                        application.jobTitle
                                                                    }
                                                                </h3>
                                                                <div
                                                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(
                                                                        application.status
                                                                    )}`}
                                                                >
                                                                    {getStatusIcon(
                                                                        application.status
                                                                    )}
                                                                    {
                                                                        application.statusLabel
                                                                    }
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-6 text-sm text-muted-foreground mb-2">
                                                                <div className="flex items-center gap-1">
                                                                    <BriefcaseIcon className="size-3" />
                                                                    {
                                                                        application.company
                                                                    }
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <MapPinIcon className="size-3" />
                                                                    {
                                                                        application.location
                                                                    }
                                                                    {application.jobType && (
                                                                        <Badge
                                                                            variant="outline"
                                                                            className="text-xs ml-1"
                                                                        >
                                                                            {
                                                                                application.jobType
                                                                            }
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <CalendarIcon className="size-3" />
                                                                    {new Date(
                                                                        application.appliedDate
                                                                    ).toLocaleDateString()}
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-4">
                                                                <div className="flex items-center gap-1 text-xs text-muted-foreground font-bold">
                                                                    <ClockIcon className="size-3" />
                                                                    <span>
                                                                        {
                                                                            application.nextStep
                                                                        }
                                                                    </span>
                                                                </div>
                                                                <ArrowRightIcon className="size-3 text-muted-foreground" />
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity px-4">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteClick(application);
                                                                }}
                                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            >
                                                                <TrashIcon className="size-4" />
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="gap-1"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    window.open(
                                                                        application.applicationUrl,
                                                                        "_blank"
                                                                    );
                                                                }}
                                                            >
                                                                <ExternalLinkIcon className="size-3" />
                                                                View job
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                )}

                {/* Rejected Applications - Compact List */}
                {rejectedApplications.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-medium text-muted-foreground">
                                Closed Applications
                            </h2>
                            <div className="text-sm text-muted-foreground">
                                {rejectedApplications.length} applications
                            </div>
                        </div>

                        <div className="space-y-3">
                            {rejectedApplications.map(
                                (
                                    application: (typeof transformedApplications)[0],
                                    index: number
                                ) => (
                                    <div key={application.id}>
                                        <div className="flex items-center justify-between py-2">
                                            <div className="flex items-center gap-3">
                                                <XCircleIcon className="size-4 text-red-600" />
                                                <div>
                                                    <div className="font-medium text-sm">
                                                        {application.jobTitle}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {application.company}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                <span>
                                                    {new Date(
                                                        application.appliedDate
                                                    ).toLocaleDateString()}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() =>
                                                            handleDeleteClick(application)
                                                        }
                                                    >
                                                        <TrashIcon className="size-3" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 px-2"
                                                        onClick={() =>
                                                            window.open(
                                                                application.applicationUrl,
                                                                "_blank"
                                                            )
                                                        }
                                                    >
                                                        <ExternalLinkIcon className="size-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                        {index <
                                            rejectedApplications.length - 1 && (
                                            <Separator className="my-2" />
                                        )}
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {transformedApplications.length === 0 && (
                    <div className="text-center py-12">
                        <BriefcaseIcon className="size-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">
                            No Applications Yet
                        </h3>
                        <p className="text-muted-foreground mb-6">
                            Start tracking your job applications to see them
                            here
                        </p>
                        <div className="flex items-center justify-center gap-3">
                            <Button
                                variant="outline"
                                className="gap-2"
                                onClick={handleApplyToSaved}
                            >
                                <BookmarkIcon className="size-4" />
                                Apply to Saved Jobs
                            </Button>
                            <Button
                                className="gap-2"
                                onClick={() => setIsDialogOpen(true)}
                            >
                                <PlusCircleIcon className="size-4" />
                                Add Your First Application
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <AddApplicationDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onApplicationAdded={handleApplicationAdded}
            />

            <DeleteApplicationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={handleDeleteConfirm}
                isDeleting={isDeleting}
                applicationTitle={applicationToDelete?.jobTitle}
                companyName={applicationToDelete?.company}
            />
        </>
    );
}
