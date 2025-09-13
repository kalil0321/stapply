"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
    Loader2Icon,
    AlertCircleIcon,
    ArrowLeftIcon,
    ExternalLinkIcon,
    CheckCircleIcon,
    XCircleIcon,
    PauseCircleIcon,
    PlayCircleIcon,
    StopCircleIcon,
    InfoIcon,
    ClockIcon
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Application } from "@/lib/types";
import Link from "next/link";
import { LiveAutomationViewer } from "@/components/live-automation-viewer";

const TaskStatus = {
    Started: "started",
    Paused: "paused",
    Finished: "finished",
    Stopped: "stopped",
};

// Helper function to get status display info
const getStatusInfo = (status: string | null) => {
    switch (status?.toLowerCase()) {
        case "started":
            return {
                icon: PlayCircleIcon,
                label: "Running",
                variant: "default" as const,
                color: "text-blue-600",
                bgColor: "bg-blue-50",
                description: "Task is currently running"
            };
        case "paused":
            return {
                icon: PauseCircleIcon,
                label: "Paused",
                variant: "secondary" as const,
                color: "text-yellow-600",
                bgColor: "bg-yellow-50",
                description: "Task has been paused"
            };
        case "finished":
            return {
                icon: CheckCircleIcon,
                label: "Finished",
                variant: "default" as const,
                color: "text-green-600",
                bgColor: "bg-green-50",
                description: "Task has completed successfully"
            };
        case "stopped":
            return {
                icon: StopCircleIcon,
                label: "Stopped",
                variant: "destructive" as const,
                color: "text-red-600",
                bgColor: "bg-red-50",
                description: "Task was stopped before completion"
            };
        default:
            return {
                icon: ClockIcon,
                label: "Unknown",
                variant: "outline" as const,
                color: "text-gray-600",
                bgColor: "bg-gray-50",
                description: "Task status is unknown"
            };
    }
};

// Helper function to get success status info
const getSuccessInfo = (isSuccess: boolean | null) => {
    if (isSuccess === true) {
        return {
            icon: CheckCircleIcon,
            label: "Success",
            variant: "default" as const,
            color: "text-green-600",
            bgColor: "bg-green-50"
        };
    } else if (isSuccess === false) {
        return {
            icon: XCircleIcon,
            label: "Failed",
            variant: "destructive" as const,
            color: "text-red-600",
            bgColor: "bg-red-50"
        };
    }
    return {
        icon: InfoIcon,
        label: "Pending",
        variant: "outline" as const,
        color: "text-gray-600",
        bgColor: "bg-gray-50"
    };
};



export default function ApplicationPage() {
    const { id } = useParams();
    const router = useRouter();

    const searchParams = useSearchParams();
    const liveUrl = searchParams.get("live");
    const fallbackUrl = searchParams.get("fallback");
    const replayUrl = searchParams.get("replay");
    const taskId = searchParams.get("task_id");

    // If we have live automation URLs, show the live viewer
    if (liveUrl && fallbackUrl && replayUrl && taskId) {
        return (
            <LiveAutomationViewer
                liveUrl={liveUrl}
                fallbackUrl={fallbackUrl}
                replayUrl={replayUrl}
                taskId={taskId}
            />
        );
    }

    // Legacy support: if we only have liveUrl, show simple iframe
    if (liveUrl) {
        return (
            <div className="flex-1 flex items-center justify-center p-6">
                <iframe src={liveUrl} className="w-full h-full border border-border rounded-lg" />
            </div>
        );
    }

    const fetchApplication = async () => {
        if (!id) {
            throw new Error("Invalid application ID");
        }
        const response = await fetch(`/api/applications/${id}`);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
            console.error("API Error:", response.status, errorData);

            if (response.status === 401) {
                router.push("/sign-in");
                throw new Error("Unauthorized - redirecting to sign in");
            }
            if (response.status === 403) {
                throw new Error(
                    "You don't have permission to view this application"
                );
            }
            if (response.status === 404) {
                throw new Error(`Application not found: ${errorData.error || 'Unknown reason'}`);
            }
            throw new Error(`Failed to load application: ${errorData.error || 'Unknown error'}`);
        }

        const data = await response.json();
        // Return all data together instead of setting individual state
        return {
            application: data.application as Application,
            url: data.url,
            output: data.output,
            status: data.status,
            isSuccess: data.isSuccess
        };
    };

    const {
        data: queryData,
        isLoading,
        error: queryError,
    } = useQuery({
        queryKey: ["application", id],
        queryFn: fetchApplication,
        enabled: !!id,
        staleTime: 2 * 60 * 1000, // 2 minutes - shorter stale time for more frequent updates
        gcTime: 10 * 60 * 1000, // 10 minutes - data stays in cache for 10 minutes
        refetchOnWindowFocus: false, // Don't refetch when window gains focus
        refetchOnReconnect: true, // Still refetch on network reconnect (useful for real-time updates)
        retry: 2, // Retry failed requests twice
        refetchInterval: (query) => {
            // Use data from the query itself, not local state
            const status = query.state.data?.status;
            return status === "started" || status === "paused" ? 30000 : false;
        },
    });

    // Extract data from query result
    const application = queryData?.application || null;
    const url = queryData?.url || null;
    const output = queryData?.output || null;
    const status = queryData?.status || null;
    const isSuccess = queryData?.isSuccess || null;
    const loading = isLoading;
    const error = queryError instanceof Error ? queryError.message : null;

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center p-6">
                <Loader2Icon className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
                <AlertCircleIcon className="w-12 h-12 text-muted-foreground/30" />
                <div className="text-center">
                    <h3 className="text-lg font-medium mb-2">Error</h3>
                    <p className="text-muted-foreground mb-4">{error}</p>
                    <Button variant="outline" onClick={() => router.back()}>
                        <ArrowLeftIcon className="w-4 h-4 mr-2" />
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    if (!application) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
                <AlertCircleIcon className="w-12 h-12 text-muted-foreground/30" />
                <div className="text-center">
                    <h3 className="text-lg font-medium mb-2">
                        Application not found
                    </h3>
                    <p className="text-muted-foreground mb-4">
                        The application you're looking for doesn't exist or has
                        been removed.
                    </p>
                    <Button variant="outline" asChild>
                        <Link href="/applications">
                            <ArrowLeftIcon className="w-4 h-4 mr-2" />
                            Back to Applications
                        </Link>
                    </Button>
                </div>
            </div>
        );
    }

    const statusInfo = getStatusInfo(status);
    const successInfo = getSuccessInfo(isSuccess);
    const StatusIcon = statusInfo.icon;
    const SuccessIcon = successInfo.icon;

    // Determine if URL should be available based on task status
    const shouldHaveUrl = status === "started" || status === "paused";
    const isTaskComplete = status === "finished" || status === "stopped";

    return (
        <div className="flex flex-col h-screen">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border p-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/applications">
                            <ArrowLeftIcon className="w-4 h-4 mr-2" />
                            Back
                        </Link>
                    </Button>
                    <Separator orientation="vertical" className="h-6" />
                    <h1 className="text-xl font-semibold">
                        {application.job?.title || "Job Title Not Available"}
                    </h1>
                    <Badge variant="outline">Applied</Badge>
                </div>
                {url && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(url, "_blank")}
                    >
                        <ExternalLinkIcon className="w-4 h-4 mr-2" />
                        Open Live Session
                    </Button>
                )}
            </div>

            {/* Compact Info Bar */}
            <div className="border-b border-border p-4 bg-muted/20">
                <div className="flex items-center justify-between">
                    {/* Left: Job Info */}
                    <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="font-medium">Company:</span>
                            <span>{application.job?.company || "Not Available"}</span>
                        </div>
                        {application.job?.location && (
                            <>
                                <Separator orientation="vertical" className="h-4" />
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">Location:</span>
                                    <span>{application.job.location}</span>
                                </div>
                            </>
                        )}
                        {application.job?.employment_type && (
                            <>
                                <Separator orientation="vertical" className="h-4" />
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">Type:</span>
                                    <span>{application.job.employment_type}</span>
                                </div>
                            </>
                        )}
                        <Separator orientation="vertical" className="h-4" />
                        <div className="flex items-center gap-2">
                            <span className="font-medium">Applied:</span>
                            <span>{new Date(application.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>

                    {/* Right: Task ID */}
                    {/* <div className="text-xs text-muted-foreground font-mono">
                        Task: {application.taskId}
                    </div> */}
                </div>
            </div>

            {/* Status Bar */}
            <div className="border-b border-border p-3 bg-background">
                <div className="flex items-center justify-between">
                    {/* Task Status */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-full ${statusInfo.bgColor}`}>
                                <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
                            </div>
                            <span className="font-medium text-sm">{statusInfo.label}</span>
                            <Badge variant={statusInfo.variant} className="text-xs">
                                {status || "Unknown"}
                            </Badge>
                        </div>

                        <Separator orientation="vertical" className="h-5" />

                        {/* Success Status */}
                        {isSuccess !== null && (
                            <div className="flex items-center gap-2">
                                <div className={`p-1 rounded-full ${successInfo.bgColor}`}>
                                    <SuccessIcon className={`w-3 h-3 ${successInfo.color}`} />
                                </div>
                                <Badge variant={successInfo.variant} className="text-xs">
                                    {successInfo.label}
                                </Badge>
                            </div>
                        )}
                    </div>

                    {/* Status Description */}
                    <span className="text-xs text-muted-foreground">
                        {statusInfo.description}
                    </span>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Job Description - Collapsible */}
                {application.job?.description && (
                    <div className="border-b border-border p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium text-sm">Description</h3>
                        </div>
                        <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded max-h-20 overflow-y-auto">
                            {application.job.description}
                        </div>
                    </div>
                )}

                {/* Output Section */}
                {output && (
                    <div className="border-b border-border p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium text-sm">Task Output</h3>
                        </div>
                        <div className="bg-muted/30 p-3 rounded max-h-32 overflow-y-auto">
                            <pre className="text-xs whitespace-pre-wrap font-mono">
                                {typeof output === 'string' ? output : JSON.stringify(output, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}

                {/* Browser Session */}
                <div className="flex-1 flex flex-col min-h-0">
                    {url ? (
                        <div className="flex-1 p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <h3 className="font-medium text-sm">Browser Session</h3>
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            </div>
                            <iframe
                                src={url}
                                className="w-full h-full border border-border rounded-lg"
                                title="Browser Session"
                                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                            />
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center p-8">
                            <div className="text-center space-y-3 max-w-md">
                                <div className="flex justify-center">
                                    <div className="p-3 rounded-full bg-muted/50">
                                        <InfoIcon className="w-8 h-8 text-muted-foreground/70" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-medium mb-1">Browser Session Unavailable</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {shouldHaveUrl
                                            ? "The browser session URL is not available yet. Please refresh the page."
                                            : isTaskComplete
                                                ? "Browser session is no longer available as the task has completed."
                                                : "Browser session will be available when the task starts running."
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
