"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
    AlertCircle,
    Loader2,
    Zap,
    CheckCircle,
    Clock,
    XCircle,
    Monitor,
    RefreshCw,
    ExternalLink,
    Share2,
    Copy,
    Calendar,
    PlayCircle,
    StopCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface LiveSearchTask {
    liveSearch: {
        id: string;
        userId: string;
        query: string;
        status: string;
        browserTaskId: string;
        agentLogs: string[];
        results: any[];
        error: string | null;
        createdAt: string;
        updatedAt: string;
        completedAt: string | null;
    };
    results: any;
    url: string | null;
    filesUrls: string[];
    isSuccess: boolean | null;
    status: "pending" | "running" | "completed" | "failed" | "stopped" | null;
    query: string;
}


export default function LiveSearchPage() {
    const { id } = useParams();
    const searchParams = useSearchParams();
    const queryText = searchParams.get("q") || "Job Search";

    const [currentLogIndex, setCurrentLogIndex] = useState(0);
    const [iframeLoading, setIframeLoading] = useState(true);
    const [iframeError, setIframeError] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const [isStoppingTask, setIsStoppingTask] = useState(false);
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Fetch live search task data
    const fetchLiveSearchData = useCallback(async () => {
        if (!id) return null;
        const response = await fetch(`/api/live-search/${id}`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error || "Failed to load live search data";
            throw new Error(errorMessage);
        }

        return response.json() as Promise<LiveSearchTask>;
    }, [id]);

    const {
        data: taskData,
        refetch,
        isLoading,
        error
    } = useQuery({
        queryKey: ["live-search", id],
        queryFn: fetchLiveSearchData,
        enabled: !!id,
        refetchInterval: (query) => {
            // Stop polling when task is completed, failed, or stopped
            if (query.state.data?.status === "completed" ||
                query.state.data?.status === "failed" ||
                query.state.data?.status === "stopped") {
                return false;
            }
            return 2000;
        }
    });
    // Function to stop the task
    const stopTask = async () => {
        if (!id || isStoppingTask) return;

        setIsStoppingTask(true);
        try {
            const response = await fetch(`/api/live-search/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to stop task');
            }

            // Refetch the data to update the UI
            await refetch();
        } catch (error) {
            console.error('Failed to stop task:', error);
            // You might want to show a toast notification here
        } finally {
            setIsStoppingTask(false);
        }
    };

    // Helper function to get status badge with success indicator
    const getStatusBadge = (status: string, isSuccess?: boolean | null) => {
        switch (status) {
            case "pending":
                return (
                    <Badge variant="secondary" className="gap-1">
                        <Clock className="h-3 w-3" />
                        Pending
                    </Badge>
                );
            case "running":
                return (
                    <Badge variant="default" className="gap-1 bg-blue-500">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Running
                    </Badge>
                );
            case "completed":
                const successVariant = isSuccess === false ? "destructive" : "default";
                const successColor = isSuccess === false ? "" : "bg-green-500";
                const successIcon = isSuccess === false ? XCircle : CheckCircle;
                const successText = isSuccess === false ? "Failed" : "Completed";
                const SuccessIcon = successIcon;

                return (
                    <Badge variant={successVariant} className={`gap-1 ${successColor}`}>
                        <SuccessIcon className="h-3 w-3" />
                        {successText}
                    </Badge>
                );
            case "failed":
                return (
                    <Badge variant="destructive" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        Failed
                    </Badge>
                );
            case "stopped":
                return (
                    <Badge variant="secondary" className="gap-1">
                        <StopCircle className="h-3 w-3" />
                        Stopped
                    </Badge>
                );
            default:
                return (
                    <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" />
                        Unknown
                    </Badge>
                );
        }
    };

    // Reset iframe loading when URL changes
    useEffect(() => {
        if (taskData?.url) {
            setIframeLoading(true);
            setIframeError(false);
        }
    }, [taskData?.url]);

    // Helper function to handle iframe load events
    const handleIframeLoad = () => {
        setIframeLoading(false);
        setIframeError(false);
    };

    const handleIframeError = () => {
        setIframeLoading(false);
        setIframeError(true);
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading live search...</p>
                </div>
            </div>
        );
    }

    if (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to load live search";
        const isNotFound = errorMessage.includes("not found") || errorMessage.includes("deleted") || errorMessage.includes("expired");
        const isAccessDenied = errorMessage.includes("Access denied");

        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center max-w-md">
                    <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">
                        {isNotFound ? "Search Not Found" : isAccessDenied ? "Access Denied" : "Error"}
                    </h3>
                    <p className="text-red-600 mb-4">{errorMessage}</p>
                    <div className="space-x-2">
                        {!isNotFound && !isAccessDenied && (
                            <Button onClick={() => refetch()}>Try Again</Button>
                        )}
                        <Button
                            variant="outline"
                            onClick={() => window.history.back()}
                        >
                            Go Back
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-gray-50/50 dark:bg-gray-900/50">
            {/* Enhanced Header */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Zap className="h-6 w-6 text-primary" />
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            </div>
                            <div className="flex-1">
                                <h1 className="text-xl font-semibold text-foreground">
                                    Live Search
                                </h1>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {taskData?.query || queryText}
                                </p>
                                {/* {taskData?.liveSearch && (
                                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            Created: {new Date(taskData.liveSearch.createdAt).toLocaleString()}
                                        </div>
                                        {taskData.liveSearch.completedAt && (
                                            <div className="flex items-center gap-1">
                                                <CheckCircle className="h-3 w-3" />
                                                Completed: {new Date(taskData.liveSearch.completedAt).toLocaleString()}
                                            </div>
                                        )}
                                    </div>
                                )} */}
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                Status: {taskData?.status || 'null'}
                            </div>

                            {/* Share Button */}
                            {taskData?.url && (
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.open(taskData.url!, '_blank')}
                                        className="gap-2"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                        Open
                                    </Button>
                                </div>
                            )}

                            {/* Stop Button - show for active tasks */}
                            {taskData && (
                                taskData.status === 'running' ||
                                taskData.status === 'pending' ||
                                taskData.liveSearch?.status === 'in_progress' ||
                                taskData.liveSearch?.status === 'pending' ||
                                (!taskData.status || (taskData.status !== 'completed' && taskData.status !== 'failed' && taskData.status !== 'stopped'))
                            ) && (
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={stopTask}
                                        disabled={isStoppingTask}
                                        className="gap-2"
                                    >
                                        {isStoppingTask ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <StopCircle className="h-4 w-4" />
                                        )}
                                        {isStoppingTask ? 'Stopping...' : 'Stop Task'}
                                    </Button>
                                )}

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => refetch()}
                                disabled={isLoading}
                                className="gap-2"
                            >
                                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 min-h-0">
                {/* Results Panel */}
                <div className="w-full lg:w-80 flex flex-col gap-3">
                    {/* Task Status Card */}
                    {taskData?.liveSearch && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <PlayCircle className="h-4 w-4" />
                                    Task Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0 space-y-3">
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Status:</span>
                                        <span>{getStatusBadge(taskData.status || taskData.liveSearch.status, taskData.isSuccess)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Task ID:</span>
                                        <span className="font-mono text-xs">{taskData.liveSearch.browserTaskId}</span>
                                    </div>
                                    {taskData.liveSearch.error && (
                                        <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
                                            <p className="text-xs text-red-600 dark:text-red-400">
                                                <strong>Error:</strong> {taskData.liveSearch.error}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* <pre>
                        {JSON.stringify(taskData, null, 2)}
                    </pre> */}

                    {taskData?.filesUrls && taskData.filesUrls.length > 0 &&
                        <div className="flex flex-col gap-2">
                            <span className="text-xs text-muted-foreground">
                                Files: {taskData.filesUrls.length}
                            </span>
                            <div className="flex items-center gap-2">
                                {taskData.filesUrls.map((url, index) => (
                                    <a href={url} target="_blank" rel="noopener noreferrer" key={index} className="text-xs text-muted-foreground">
                                        {url}
                                    </a>
                                ))}
                            </div>
                        </div>
                    }

                    {/* Results Card */}
                    {taskData?.results && (
                        <Card className="flex-1">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4" />
                                    Search Results
                                    {taskData.isSuccess !== null && (
                                        <Badge variant={taskData.isSuccess ? "default" : "destructive"} className="ml-auto">
                                            {taskData.isSuccess ? "Success" : "Failed"}
                                        </Badge>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="bg-muted/50 rounded-lg p-3 max-h-64 overflow-y-auto">
                                    <pre className="text-xs whitespace-pre-wrap text-muted-foreground">
                                        {typeof taskData.results === 'string'
                                            ? taskData.results
                                            : JSON.stringify(taskData.results, null, 2)
                                        }
                                    </pre>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Agent Logs Card */}
                    {taskData?.liveSearch?.agentLogs && taskData.liveSearch.agentLogs.length > 0 && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Monitor className="h-4 w-4" />
                                    Agent Logs
                                    <Badge variant="secondary" className="ml-auto">
                                        {taskData.liveSearch.agentLogs.length}
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {taskData.liveSearch.agentLogs.map((log, index) => (
                                        <div key={index} className="text-xs p-2 bg-muted/30 rounded border">
                                            <pre className="whitespace-pre-wrap text-muted-foreground">
                                                {log}
                                            </pre>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Browser View */}
                <div className="flex-1 flex flex-col min-h-0">
                    <Card className="flex-1 flex flex-col border-none shadow-none">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2">
                                    <Monitor className="h-4 w-4" />
                                    Live Browser Session
                                </span>
                                {iframeLoading && (
                                    <Badge variant="secondary" className="gap-1 text-xs">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        Loading...
                                    </Badge>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col min-h-0 pt-0">
                            <div className="relative flex-1 min-h-0 bg-white dark:bg-gray-900 rounded-lg border overflow-hidden">
                                {/* Loading Overlay */}
                                {iframeLoading && (
                                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
                                        <div className="text-center space-y-4">
                                            <Skeleton className="w-full h-8 mx-auto" />
                                            <Skeleton className="w-3/4 h-4 mx-auto" />
                                            <Skeleton className="w-1/2 h-4 mx-auto" />
                                            <div className="flex justify-center">
                                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                Loading browser session...
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Error State */}
                                {iframeError && (
                                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
                                        <div className="text-center space-y-4">
                                            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
                                            <div>
                                                <h3 className="font-medium">Failed to Load Browser Session</h3>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    The live browser session could not be displayed.
                                                </p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setIframeError(false);
                                                    setIframeLoading(true);
                                                }}
                                                className="gap-2"
                                            >
                                                <RefreshCw className="h-4 w-4" />
                                                Try Again
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* No URL State */}
                                {!taskData?.url && !isLoading && (
                                    <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                                        <div className="text-center space-y-4">
                                            <Monitor className="h-12 w-12 text-muted-foreground mx-auto" />
                                            <div>
                                                <h3 className="font-medium">No Browser Session Available</h3>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {taskData?.status === 'pending' || taskData?.liveSearch?.status === 'pending'
                                                        ? 'Browser session is starting...'
                                                        : taskData?.status === 'running' || taskData?.liveSearch?.status === 'in_progress'
                                                            ? 'Browser session is running but not yet available...'
                                                            : taskData?.status === 'failed' || taskData?.liveSearch?.status === 'failed' || taskData?.isSuccess === false
                                                                ? 'Browser session failed to start.'
                                                                : 'Browser session URL not available yet.'
                                                    }
                                                </p>
                                                {(taskData?.status === 'failed' || taskData?.liveSearch?.status === 'failed' || taskData?.isSuccess === false) && taskData?.liveSearch?.error && (
                                                    <p className="text-xs text-red-500 mt-2 max-w-md">
                                                        {taskData.liveSearch.error}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Iframe */}
                                {taskData?.url && (
                                    <iframe
                                        src={taskData.url}
                                        className="w-full h-full border-0"
                                        onLoad={handleIframeLoad}
                                        onError={handleIframeError}
                                        title="Live Browser Session"
                                        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                                    />
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
