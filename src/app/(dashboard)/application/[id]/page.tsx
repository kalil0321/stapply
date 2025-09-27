"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
    Loader2Icon,
    AlertCircleIcon,
    ArrowLeftIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Application } from "@/lib/types";
import Link from "next/link";
import { LiveAutomationViewer } from "@/components/live-automation-viewer";
import { ServerApplicationView } from "@/components/server-application-view";
import { BrowserApplicationView } from "@/components/browser-application-view";




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

    // Check if this is a server application (stapply)
    const isServerApplication = application?.taskId?.startsWith("stapply-");

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

    // Render appropriate UI based on application type
    if (isServerApplication) {
        return (
            <ServerApplicationView
                application={application}
                status={status}
                isSuccess={isSuccess}
                output={output}
            />
        );
    }

    // Default to browser/cloud application view
    return (
        <BrowserApplicationView
            application={application}
            status={status}
            isSuccess={isSuccess}
            output={output}
            url={url}
        />
    );
}
