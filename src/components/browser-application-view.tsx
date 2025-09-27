import {
    ArrowLeftIcon,
    CheckCircleIcon,
    XCircleIcon,
    PauseCircleIcon,
    PlayCircleIcon,
    StopCircleIcon,
    InfoIcon,
    ClockIcon,
    ExternalLinkIcon} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Application } from "@/lib/types";
import Link from "next/link";

interface BrowserApplicationViewProps {
    application: Application;
    status: string | null;
    isSuccess: boolean | null;
    output: any;
    url: string | null;
}

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

export function BrowserApplicationView({
    application,
    status,
    isSuccess,
    output,
    url
}: BrowserApplicationViewProps) {
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
            <div className="flex items-center justify-between border-b border-border p-2">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/applications">
                            <ArrowLeftIcon className="w-4 h-4 mr-2" />
                            Back
                        </Link>
                    </Button>
                    <Separator orientation="vertical" className="h-6" />
                    <div className="flex items-center gap-3">
                        <div>
                            <h1 className="text-xl font-semibold">
                                {application.job?.title || "Job Title Not Available"}
                            </h1>
                        </div>
                    </div>
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
            <div className="border-b border-border p-4">
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

                        <span className="text-xs text-muted-foreground">
                            {statusInfo.description}
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
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
