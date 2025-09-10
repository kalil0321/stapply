"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { 
    Loader2Icon, 
    AlertCircleIcon, 
    ArrowLeftIcon, 
    ExternalLinkIcon, 
    CheckCircleIcon, 
    XCircleIcon,
    InfoIcon,
    ClockIcon,
    PlayIcon,
    Settings2Icon,
    BrainIcon,
    RocketIcon,
    FileTextIcon,
    MonitorIcon,
    EyeIcon,
    EyeOffIcon
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { JobCard } from "@/components/job-card";

interface Job {
    id: string;
    title: string;
    company: string;
    link: string;
    location?: string;
    description?: string;
    employmentType?: string;
}

interface LocalApplicationResult {
    status: "success" | "partial" | "failed";
    summary: string;
    actions: string[];
    notes: string;
    confidence?: "high" | "medium" | "low";
    application_submitted?: boolean;
    raw_history?: string;
}

interface LocalApplicationResponse {
    success: boolean;
    job: Job;
    result: LocalApplicationResult;
    timestamp: string;
    userId: string;
}

// Helper function to get status display info
const getStatusInfo = (status: string) => {
    switch (status) {
        case "success":
            return {
                icon: CheckCircleIcon,
                label: "Success",
                variant: "default" as const,
                color: "text-green-600",
                bgColor: "bg-green-50",
                description: "Application completed successfully"
            };
        case "partial":
            return {
                icon: InfoIcon,
                label: "Partial",
                variant: "secondary" as const,
                color: "text-yellow-600",
                bgColor: "bg-yellow-50",
                description: "Application partially completed"
            };
        case "failed":
            return {
                icon: XCircleIcon,
                label: "Failed",
                variant: "destructive" as const,
                color: "text-red-600",
                bgColor: "bg-red-50",
                description: "Application failed to complete"
            };
        default:
            return {
                icon: ClockIcon,
                label: "Unknown",
                variant: "outline" as const,
                color: "text-gray-600",
                bgColor: "bg-gray-50",
                description: "Unknown status"
            };
    }
};

export default function LocalApplicationPage() {
    const { id } = useParams();
    const router = useRouter();
    const [instructions, setInstructions] = useState("");
    const [headless, setHeadless] = useState(true);
    const [maxSteps, setMaxSteps] = useState(100);
    const [applicationResult, setApplicationResult] = useState<LocalApplicationResponse | null>(null);
    
    // Fetch job details
    const fetchJobDetails = async () => {
        if (!id) {
            throw new Error("Invalid job ID");
        }
        const response = await fetch(`/api/local-applications/${id}`);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
            console.error("API Error:", response.status, errorData);
            
            if (response.status === 401) {
                router.push("/sign-in");
                throw new Error("Unauthorized - redirecting to sign in");
            }
            if (response.status === 404) {
                throw new Error(`Job not found: ${errorData.error || 'Unknown reason'}`);
            }
            throw new Error(`Failed to load job: ${errorData.error || 'Unknown error'}`);
        }

        const data = await response.json();
        return data;
    };

    const {
        data: jobData,
        isLoading: loadingJob,
        error: jobError,
    } = useQuery({
        queryKey: ["local-application-job", id],
        queryFn: fetchJobDetails,
        enabled: !!id,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 2,
    });

    // Apply to job mutation
    const applyMutation = useMutation({
        mutationFn: async () => {
            if (!id) throw new Error("No job ID");
            
            const response = await fetch(`/api/local-applications/${id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    instructions,
                    headless,
                    maxSteps,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to submit application");
            }

            return response.json() as Promise<LocalApplicationResponse>;
        },
        onSuccess: (data) => {
            setApplicationResult(data);
        },
    });

    const handleApply = () => {
        applyMutation.mutate();
    };

    if (loadingJob) {
        return (
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center space-y-4">
                    <Loader2Icon className="w-8 h-8 animate-spin mx-auto" />
                    <p className="text-muted-foreground">Loading job details...</p>
                </div>
            </div>
        );
    }

    if (jobError) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
                <AlertCircleIcon className="w-12 h-12 text-muted-foreground/30" />
                <div className="text-center">
                    <h3 className="text-lg font-medium mb-2">Error</h3>
                    <p className="text-muted-foreground mb-4">
                        {jobError instanceof Error ? jobError.message : "Unknown error"}
                    </p>
                    <Button variant="outline" onClick={() => router.back()}>
                        <ArrowLeftIcon className="w-4 h-4 mr-2" />
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    if (!jobData?.job) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
                <AlertCircleIcon className="w-12 h-12 text-muted-foreground/30" />
                <div className="text-center">
                    <h3 className="text-lg font-medium mb-2">Job not found</h3>
                    <p className="text-muted-foreground mb-4">
                        The job you're looking for doesn't exist or has been removed.
                    </p>
                    <Button variant="outline" asChild>
                        <Link href="/search">
                            <ArrowLeftIcon className="w-4 h-4 mr-2" />
                            Back to Search
                        </Link>
                    </Button>
                </div>
            </div>
        );
    }

    const job = jobData.job;

    return (
        <div className="flex flex-col h-screen">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border p-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/search">
                            <ArrowLeftIcon className="w-4 h-4 mr-2" />
                            Back
                        </Link>
                    </Button>
                    <Separator orientation="vertical" className="h-6" />
                    <h1 className="text-xl font-semibold">Local Application</h1>
                    <Badge variant="outline" className="flex items-center gap-1">
                        <RocketIcon className="w-3 h-3" />
                        Automated
                    </Badge>
                </div>
                {job.link && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(job.link, "_blank")}
                    >
                        <ExternalLinkIcon className="w-4 h-4 mr-2" />
                        View Job Listing
                    </Button>
                )}
            </div>

            {/* Job Info */}
            <div className="border-b border-border p-4 bg-muted/20">
                <JobCard job={job} className="border-0 bg-transparent p-0 hover:bg-transparent" />
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden">
                {applicationResult ? (
                    // Show results
                    <div className="h-full overflow-y-auto">
                        <ApplicationResults result={applicationResult} />
                    </div>
                ) : (
                    // Show application form
                    <div className="h-full overflow-y-auto p-6">
                        <div className="max-w-4xl mx-auto space-y-6">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <RocketIcon className="w-5 h-5" />
                                        <CardTitle>Local Job Application</CardTitle>
                                    </div>
                                    <CardDescription>
                                        Use your local automation server to apply to this job. The system will automatically 
                                        fill out the application form using your profile information.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <Tabs defaultValue="instructions" className="w-full">
                                        <TabsList className="grid w-full grid-cols-2">
                                            <TabsTrigger value="instructions" className="flex items-center gap-2">
                                                <FileTextIcon className="w-4 h-4" />
                                                Instructions
                                            </TabsTrigger>
                                            <TabsTrigger value="settings" className="flex items-center gap-2">
                                                <Settings2Icon className="w-4 h-4" />
                                                Settings
                                            </TabsTrigger>
                                        </TabsList>
                                        
                                        <TabsContent value="instructions" className="space-y-4 mt-6">
                                            <div className="space-y-3">
                                                <Label htmlFor="instructions" className="text-base font-medium flex items-center gap-2">
                                                    <BrainIcon className="w-4 h-4" />
                                                    Application Instructions
                                                </Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Provide specific instructions for the automation. This helps customize 
                                                    the application to highlight relevant experience or address specific requirements.
                                                </p>
                                                <Textarea
                                                    id="instructions"
                                                    placeholder="e.g., 'Please emphasize my Python and AI experience. Mention my interest in remote work opportunities. If asked about salary expectations, indicate that I'm open to discussion.'"
                                                    value={instructions}
                                                    onChange={(e) => setInstructions(e.target.value)}
                                                    className="min-h-[120px] resize-none"
                                                />
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="settings" className="space-y-6 mt-6">
                                            <div className="grid gap-6 md:grid-cols-2">
                                                <div className="space-y-3">
                                                    <Label className="text-base font-medium flex items-center gap-2">
                                                        <MonitorIcon className="w-4 h-4" />
                                                        Browser Mode
                                                    </Label>
                                                    <div className="flex items-center space-x-3 p-3 border rounded-lg">
                                                        <div className="flex items-center gap-2">
                                                            {headless ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                                                            <Label htmlFor="headless" className="cursor-pointer">
                                                                {headless ? "Headless Mode" : "Visible Mode"}
                                                            </Label>
                                                        </div>
                                                        <Switch
                                                            id="headless"
                                                            checked={headless}
                                                            onCheckedChange={setHeadless}
                                                        />
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {headless 
                                                            ? "Browser runs in background (faster, less resource intensive)"
                                                            : "Browser window will be visible (useful for debugging)"
                                                        }
                                                    </p>
                                                </div>

                                                <div className="space-y-3">
                                                    <Label className="text-base font-medium flex items-center gap-2">
                                                        <Settings2Icon className="w-4 h-4" />
                                                        Max Steps
                                                    </Label>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-3">
                                                            <input
                                                                type="range"
                                                                min="20"
                                                                max="200"
                                                                step="10"
                                                                value={maxSteps}
                                                                onChange={(e) => setMaxSteps(Number(e.target.value))}
                                                                className="flex-1"
                                                            />
                                                            <Badge variant="outline" className="min-w-[60px] justify-center">
                                                                {maxSteps}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">
                                                            Maximum number of automation steps. Higher values allow more complex applications but take longer.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </TabsContent>
                                    </Tabs>

                                    <Separator />

                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-muted-foreground">
                                            <p>✅ Your profile information will be used automatically</p>
                                            <p>🔄 The process typically takes 2-5 minutes</p>
                                            <p>📧 Check your email for confirmation after completion</p>
                                        </div>
                                        <Button
                                            onClick={handleApply}
                                            disabled={applyMutation.isPending}
                                            size="lg"
                                            className="min-w-[140px]"
                                        >
                                            {applyMutation.isPending ? (
                                                <>
                                                    <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                                                    Applying...
                                                </>
                                            ) : (
                                                <>
                                                    <PlayIcon className="w-4 h-4 mr-2" />
                                                    Start Application
                                                </>
                                            )}
                                        </Button>
                                    </div>

                                    {applyMutation.error && (
                                        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                                            <div className="flex items-center gap-2 text-destructive font-medium mb-1">
                                                <AlertCircleIcon className="w-4 h-4" />
                                                Application Failed
                                            </div>
                                            <p className="text-sm text-destructive/80">
                                                {applyMutation.error instanceof Error 
                                                    ? applyMutation.error.message 
                                                    : "Unknown error occurred"
                                                }
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Results component
function ApplicationResults({ result }: { result: LocalApplicationResponse }) {
    const statusInfo = getStatusInfo(result.result.status);
    const StatusIcon = statusInfo.icon;

    return (
        <div className="p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Status Card */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${statusInfo.bgColor}`}>
                                    <StatusIcon className={`w-5 h-5 ${statusInfo.color}`} />
                                </div>
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        Application {statusInfo.label}
                                        <Badge variant={statusInfo.variant}>
                                            {result.result.status}
                                        </Badge>
                                    </CardTitle>
                                    <CardDescription>
                                        {statusInfo.description} • {new Date(result.timestamp).toLocaleString()}
                                    </CardDescription>
                                </div>
                            </div>
                            {result.result.confidence && (
                                <Badge variant="outline" className="flex items-center gap-1">
                                    <BrainIcon className="w-3 h-3" />
                                    {result.result.confidence} confidence
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h4 className="font-medium mb-2">Summary</h4>
                            <p className="text-muted-foreground">{result.result.summary}</p>
                        </div>

                        {result.result.actions.length > 0 && (
                            <div>
                                <h4 className="font-medium mb-2">Actions Taken</h4>
                                <ul className="space-y-1">
                                    {result.result.actions.map((action, index) => (
                                        <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />
                                            {action}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {result.result.notes && (
                            <div>
                                <h4 className="font-medium mb-2">Notes</h4>
                                <p className="text-muted-foreground">{result.result.notes}</p>
                            </div>
                        )}

                        {result.result.application_submitted !== undefined && (
                            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                                {result.result.application_submitted ? (
                                    <>
                                        <CheckCircleIcon className="w-4 h-4 text-green-600" />
                                        <span className="text-sm font-medium">Application likely submitted successfully</span>
                                    </>
                                ) : (
                                    <>
                                        <XCircleIcon className="w-4 h-4 text-red-600" />
                                        <span className="text-sm font-medium">Application may not have been submitted</span>
                                    </>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Raw History (Collapsible) */}
                {result.result.raw_history && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Technical Details</CardTitle>
                            <CardDescription>
                                Raw automation history for debugging purposes
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-muted/30 p-4 rounded-lg max-h-64 overflow-y-auto">
                                <pre className="text-xs whitespace-pre-wrap font-mono text-muted-foreground">
                                    {result.result.raw_history}
                                </pre>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                    <Button asChild>
                        <Link href="/applications">
                            View All Applications
                        </Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/search">
                            Find More Jobs
                        </Link>
                    </Button>
                    {result.job.link && (
                        <Button variant="outline" onClick={() => window.open(result.job.link, "_blank")}>
                            <ExternalLinkIcon className="w-4 h-4 mr-2" />
                            View Original Listing
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
