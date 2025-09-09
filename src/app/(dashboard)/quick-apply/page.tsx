"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link2, Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useProfile } from "@/hooks/use-profile";
import Link from "next/link";

interface ApplicationResult {
    success: boolean;
    applicationId?: string;
    submittedAt?: string;
    method?: string;
    status?: string;
    message?: string;
    error?: string;
    taskUrl?: string;
}

export default function QuickApplyPage() {
    const [jobUrl, setJobUrl] = useState("");
    const [notes, setNotes] = useState("");
    const [applicationResult, setApplicationResult] = useState<ApplicationResult | null>(null);

    // Check if user has a profile
    const { profile, isLoading: profileLoading, isProfileComplete } = useProfile();

    // Apply to job mutation
    const applyMutation = useMutation({
        mutationFn: async ({ url, notes }: { url: string; notes?: string }) => {

            // Apply to the job with profile data
            const response = await fetch("/api/apply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jobUrl: url,
                    profile,
                    notes,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to apply");
            }

            return response.json();
        },
        onSuccess: (data) => {
            setApplicationResult({
                success: true,
                ...data,
            });
            setJobUrl("");
            setNotes("");
        },
        onError: (error: Error) => {
            setApplicationResult({
                success: false,
                error: error.message,
            });
        },
    });

    const handleApply = () => {
        if (!jobUrl.trim()) return;
        
        try {
            new URL(jobUrl); // Validate URL
            applyMutation.mutate({ url: jobUrl.trim(), notes: notes.trim() || undefined });
        } catch {
            setApplicationResult({
                success: false,
                error: "Please enter a valid URL",
            });
        }
    };

    const isValidUrl = (url: string) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };

    const hasProfile = profile && isProfileComplete();

    if (profileLoading) {
        return (
            <div className="container mx-auto px-6 py-8 max-w-2xl">
                <div className="text-center">Loading...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-6 py-8 max-w-2xl">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <Link2 className="h-6 w-6" />
                    <h1 className="text-3xl font-bold">Quick Apply</h1>
                    <Badge variant="outline">Auto-Apply</Badge>
                </div>
                <p className="text-muted-foreground">
                    Automatically apply to jobs using your profile information
                </p>
            </div>

            {/* Profile Check */}
            {!hasProfile && (
                <div className="mb-8 p-4 border border-dashed rounded-lg">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 mt-0.5" />
                        <div>
                            <p className="font-medium mb-1">Profile Required</p>
                            <p className="text-sm text-muted-foreground mb-3">
                                Complete your profile to enable automatic job applications.
                            </p>
                            <Link href="/profile">
                                <Button variant="outline" size="sm">
                                    Complete Profile
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Application Form */}
            <div className="space-y-6 mb-8">
                <div>
                    <label className="text-sm font-medium mb-2 block">
                        Job Listing URL
                    </label>
                    <Input
                        type="url"
                        placeholder="https://company.com/careers/job-posting"
                        value={jobUrl}
                        onChange={(e) => setJobUrl(e.target.value)}
                        className={jobUrl && !isValidUrl(jobUrl) ? "border-destructive" : ""}
                    />
                    {jobUrl && !isValidUrl(jobUrl) && (
                        <p className="text-xs text-destructive mt-1">Please enter a valid URL</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                        Supported: LinkedIn, Indeed, Glassdoor, company career pages
                    </p>
                </div>

                <div>
                    <label className="text-sm font-medium mb-2 block">
                        Notes (Optional)
                    </label>
                    <textarea
                        className="w-full px-3 py-2 border border-input rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        placeholder="Add any specific notes or cover letter points..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                    />
                </div>

                <Button
                    onClick={handleApply}
                    disabled={!jobUrl.trim() || !isValidUrl(jobUrl) || !hasProfile || applyMutation.isPending}
                    className="w-full"
                    size="lg"
                >
                    {applyMutation.isPending ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Applying...
                        </>
                    ) : (
                        <>
                            <Send className="w-4 h-4 mr-2" />
                            Apply Automatically
                        </>
                    )}
                </Button>
            </div>

            {/* Application Result */}
            {applicationResult && (
                <div className="mb-8 p-4 border rounded-lg">
                    <div className="flex items-start gap-3">
                        {applicationResult.success ? (
                            <CheckCircle className="h-5 w-5 mt-0.5" />
                        ) : (
                            <AlertCircle className="h-5 w-5 mt-0.5" />
                        )}
                        <div className="flex-1">
                            <p className="font-medium mb-1">
                                {applicationResult.success ? 'Application Submitted!' : 'Application Failed'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {applicationResult.success 
                                    ? applicationResult.message || 'Your application has been submitted successfully.'
                                    : applicationResult.error || 'There was an error submitting your application.'
                                }
                            </p>
                            
                            {applicationResult.success && applicationResult.applicationId && (
                                <div className="mt-3 p-3 bg-muted rounded text-xs space-y-1">
                                    <div>
                                        <span className="font-medium">Application ID: </span>
                                        <code>{applicationResult.applicationId}</code>
                                    </div>
                                    {applicationResult.submittedAt && (
                                        <div>
                                            <span className="font-medium">Submitted: </span>
                                            {new Date(applicationResult.submittedAt).toLocaleString()}
                                        </div>
                                    )}
                                    {applicationResult.taskUrl && (
                                        <div>
                                            <span className="font-medium">Watch Browser: </span>
                                            <a 
                                                href={applicationResult.taskUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800 underline"
                                            >
                                                View Live Task
                                            </a>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* How it Works */}
            <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4">How it Works</h2>
                <div className="space-y-4">
                    <div className="flex gap-4">
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0 mt-0.5">
                            1
                        </div>
                        <div>
                            <p className="font-medium mb-1">Analyze Job Posting</p>
                            <p className="text-sm text-muted-foreground">
                                Extract job details and requirements from the URL
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0 mt-0.5">
                            2
                        </div>
                        <div>
                            <p className="font-medium mb-1">Navigate & Apply</p>
                            <p className="text-sm text-muted-foreground">
                                Find the application form and fill it with your profile data
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0 mt-0.5">
                            3
                        </div>
                        <div>
                            <p className="font-medium mb-1">Submit Application</p>
                            <p className="text-sm text-muted-foreground">
                                Submit your application and provide confirmation details
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Links */}
            <div className="flex flex-wrap gap-3">
                <Link href="/applications">
                    <Button variant="outline" size="sm">
                        View Applications
                    </Button>
                </Link>
                <Link href="/saved-jobs">
                    <Button variant="outline" size="sm">
                        Saved Jobs
                    </Button>
                </Link>
                <Link href="/profile">
                    <Button variant="outline" size="sm">
                        Update Profile
                    </Button>
                </Link>
            </div>
        </div>
    );
}
