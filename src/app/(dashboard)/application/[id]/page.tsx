"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import {
    Loader2Icon,
    AlertCircleIcon,
    ArrowLeftIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Application } from "@/lib/types";
import Link from "next/link";
import { KernelApplicationView } from "@/components/kernel-application-view";

export default function ApplicationPage() {
    const { id } = useParams();
    const router = useRouter();

    const fetchApplication = async () => {
        if (!id) {
            throw new Error("Invalid application ID");
        }
        const response = await fetch(`/api/applications/${id}`);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
            console.error("API Error:", response.status, errorData);

            if (response.status === 401) {
                router.push("/");
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
            const status = query.state.data?.application.status;
            return status !== "completed" ? 60_000 : false; // 60 seconds
        },
    });

    // Extract data from query result
    const application = queryData?.application || null;
    const loading = isLoading;
    const error = queryError instanceof Error ? queryError.message : null;

    // Check if this is a local chrome instance application
    const isServerApplication = application?.sessionId?.startsWith("stapply-");
    if (isServerApplication) {
        return (<span>
            Sorry, we cannot view this application because it was created using a local chrome instance. We are working on it.
        </span>)
    }

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

    return (
        <KernelApplicationView
            application={application as Application}
            isLoading={loading}
            error={error as Error | null}
        />
    );
}
