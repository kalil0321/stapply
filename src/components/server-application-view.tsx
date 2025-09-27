import {
    ArrowLeftIcon,
    ExternalLinkIcon,
    MonitorIcon} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Application } from "@/lib/types";
import Link from "next/link";

interface ServerApplicationViewProps {
    application: Application;
    status: string | null;
    output: any;
}

export function ServerApplicationView({
    application,
    status,
    output
}: ServerApplicationViewProps) {

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
                {application.job?.link && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(application.job?.link, "_blank")}
                    >
                        <ExternalLinkIcon className="w-4 h-4 mr-2" />
                        View Job Posting
                    </Button>
                )}
            </div>

            {/* Server Info Bar */}
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
                    </div>
                </div>
            </div>


            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">

                {/* Server Output Section */}
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="border-b border-border p-4">
                        <div className="flex items-center gap-2 mb-3">
                            {status === "started" && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                            )}
                        </div>

                        {output ? (
                            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-xs overflow-auto max-h-80">
                                <pre className="whitespace-pre-wrap">
                                    {typeof output === 'string' ? output : JSON.stringify(output, null, 2)}
                                </pre>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center p-8 bg-muted/30 rounded-lg">
                                <div className="text-center space-y-3">
                                    <div className="flex justify-center">
                                        <div className="p-3 rounded-full bg-blue-50">
                                            <MonitorIcon className="w-8 h-8 text-blue-600" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-medium mb-1">Server Processing</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {status === "started"
                                                ? "Server application is currently running. Output will appear here when available."
                                                : status === "finished"
                                                    ? "Server application completed but no output was captured."
                                                    : "Waiting for server application to start processing."
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
