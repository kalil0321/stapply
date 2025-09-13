"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    User,
    CheckCircle,
    AlertCircle,
    Loader2Icon,
    FileText,
} from "lucide-react";
import { SavedJob } from "@/lib/types";
import { JobCard } from "./job-card";

interface ApplicationSheetProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    savedJob: SavedJob | null;
    isLocal: boolean;
}

interface ProfileData {
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    location?: string;
    summary?: string;
    skills?: string[];
    experience?: any[];
    education?: any[];
    languages?: any[];
    resumeUploaded?: boolean;
}

export function ApplicationSheet({
    isOpen,
    onOpenChange,
    savedJob,
    isLocal,
}: ApplicationSheetProps) {
    const router = useRouter();
    const [applying, setApplying] = useState(false);
    const [applicationError, setApplicationError] = useState<string | null>(null);
    const [instructions, setInstructions] = useState("");

    const fetchProfile = async () => {
        const response = await fetch("/api/profile");
        if (!response.ok) {
            if (response.status === 404) {
                return {} as ProfileData;
            }
            if (response.status === 401) {
                throw new Error(
                    "Authentication required. Please sign in again."
                );
            }
            throw new Error("Failed to fetch profile");
        }
        const data = await response.json();
        return data.profile as ProfileData;
    };

    const {
        data: profile,
        isFetching: loadingProfile,
        error: profileError,
        refetch: refetchProfile,
    } = useQuery({
        queryKey: ["profile"],
        queryFn: fetchProfile,
        staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
        gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
        retry: 1,
    });

    // Reset application error when sheet opens/closes
    useEffect(() => {
        if (isOpen) {
            setApplicationError(null);
        }
    }, [isOpen]);

    const applyMutation = useMutation({
        mutationFn: async (jobId: string) => {
            const response = await fetch("/api/applications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ jobId, instructions, isLocal }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (response.status === 409) {
                    throw new Error("You have already applied to this job");
                }
                if (response.status === 500 && errorData.error?.includes("local server")) {
                    throw new Error("Unable to connect to local automation server. Please ensure the server is running and try again.");
                }
                if (response.status === 400 && errorData.error?.includes("profile")) {
                    throw new Error("Profile incomplete. Please update your profile with all required information.");
                }
                if (response.status === 400 && errorData.error?.includes("resume")) {
                    throw new Error("Resume not found. Please upload your resume in your profile.");
                }
                throw new Error(
                    errorData.error || "Failed to submit application. Please try again."
                );
            }

            return response.json();
        },
    });

    const handleApply = async () => {
        if (!savedJob?.jobId) return;

        setApplying(true);
        setApplicationError(null);

        try {
            const data = await applyMutation.mutateAsync(savedJob.jobId);
            onOpenChange(false);

            if (isLocal) {
                const params = new URLSearchParams({
                    live: data.live_url,
                    fallback: data.fallback_url,
                    replay: data.replay_url,
                    task_id: data.task_id
                });
                router.push(`/application/${savedJob.jobId}?${params.toString()}`);
            } else {
                router.push(`/application/${data.application.id}`);
            }
        } catch (err) {
            console.error("Error submitting application:", err);
            setApplicationError(
                err instanceof Error
                    ? err.message
                    : "Failed to submit application. Please try again."
            );
        } finally {
            setApplying(false);
        }
    };

    // Check profile completeness in detail
    const profileChecks = {
        hasBasicInfo: !!(
            profile?.firstName &&
            profile?.lastName &&
            profile?.email
        ),
        hasContactInfo: !!profile?.phone,
        hasLocation: !!profile?.location,
        hasSummary: !!(profile?.summary && profile.summary.trim().length > 0),
        hasSkills: !!(profile?.skills && profile.skills.length > 0),
        hasResume: !!profile?.resumeUploaded,
        hasExperience: !!(
            profile?.experience &&
            Array.isArray(profile.experience) &&
            profile.experience.length > 0
        ),
        hasEducation: !!(
            profile?.education &&
            Array.isArray(profile.education) &&
            profile.education.length > 0
        ),
    };

    const criticalMissing: string[] = [];
    const recommendedMissing: string[] = [];

    // Critical requirements
    if (!profileChecks.hasBasicInfo)
        criticalMissing.push("Basic information (name and email)");
    if (!profileChecks.hasResume) criticalMissing.push("Resume upload");

    // Recommended requirements
    if (!profileChecks.hasContactInfo) recommendedMissing.push("Phone number");
    if (!profileChecks.hasLocation) recommendedMissing.push("Location");
    if (!profileChecks.hasSummary)
        recommendedMissing.push("Professional summary");
    if (!profileChecks.hasSkills) recommendedMissing.push("Skills");
    if (!profileChecks.hasExperience)
        recommendedMissing.push("Work experience");
    if (!profileChecks.hasEducation) recommendedMissing.push("Education");

    const isProfileComplete = criticalMissing.length === 0;
    const hasAllRecommended = recommendedMissing.length === 0;

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-2">
                <SheetHeader className="space-y-4 pb-0">
                    <div>
                        <SheetTitle className="text-xl">
                            Apply for Position
                        </SheetTitle>
                        <SheetDescription>
                            Review your profile information and submit your
                            application
                        </SheetDescription>
                    </div>

                    {savedJob && savedJob.job && (
                        <JobCard
                            job={savedJob.job}
                            className="p-0 border-0 hover:bg-transparent"
                        />
                    )}
                </SheetHeader>

                <Separator className="mt-2" />

                {loadingProfile ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2Icon className="w-6 h-6 animate-spin" />
                        <span className="ml-2">Loading profile...</span>
                    </div>
                ) : profileError ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                        <AlertCircle className="w-12 h-12 text-destructive mb-2" />
                        <div className="space-y-2">
                            <h3 className="font-medium text-destructive">
                                Unable to Load Profile
                            </h3>
                            <p className="text-sm text-muted-foreground max-w-md">
                                {profileError instanceof Error ? profileError.message : "Failed to load your profile information"}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => refetchProfile()}>
                                Try Again
                            </Button>
                            {profileError instanceof Error && profileError.message.includes("Authentication") ? (
                                <Button
                                    variant="default"
                                    onClick={() => {
                                        onOpenChange(false);
                                        router.push("/sign-in");
                                    }}
                                >
                                    Sign In
                                </Button>
                            ) : (
                                <Button
                                    variant="default"
                                    onClick={() => {
                                        onOpenChange(false);
                                        router.push("/profile?update=true");
                                    }}
                                >
                                    Create Profile
                                </Button>
                            )}
                        </div>
                    </div>
                ) : (
                    <Tabs defaultValue="profile" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="profile" className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Profile
                            </TabsTrigger>
                            <TabsTrigger value="instructions" className="flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Instructions
                            </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="profile" className="space-y-4 mt-4">
                            {/* Profile Completeness Status */}
                            {!profile || Object.keys(profile).length === 0 ? (
                                <div className="flex flex-col items-center justify-center gap-4 py-8">
                                    <AlertCircle className="w-6 h-6 text-amber-500 mb-1" />
                                    <div className="text-sm text-muted-foreground text-center">
                                        No profile found.
                                        <br />
                                        Please create your profile to apply for
                                        jobs.
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full max-w-xs"
                                        onClick={() => {
                                            onOpenChange(false);
                                            router.push("/profile?update=true");
                                        }}
                                    >
                                        Create Profile
                                    </Button>
                                </div>
                            ) : (
                                <div
                                    className={`rounded-lg px-4 pb-4 transition-colors ${
                                        criticalMissing.length > 0
                                            ? "bg-red-50/50 dark:bg-red-900/10"
                                            : hasAllRecommended
                                            ? "bg-green-50/50 dark:bg-green-900/10"
                                            : "bg-amber-50/50 dark:bg-amber-900/10"
                                    }`}
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        {isProfileComplete && hasAllRecommended ? (
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                        ) : criticalMissing.length > 0 ? (
                                            <AlertCircle className="w-5 h-5 text-destructive" />
                                        ) : (
                                            <AlertCircle className="w-5 h-5 text-amber-500" />
                                        )}
                                        <h3 className="font-medium">
                                            Profile Status
                                        </h3>
                                    </div>
                                    {isProfileComplete && hasAllRecommended ? (
                                        <p className="text-sm text-green-700 dark:text-green-400">
                                            ✅ Your profile is complete and
                                            optimized for applications!
                                        </p>
                                    ) : (
                                        <div className="space-y-3">
                                            {criticalMissing.length > 0 && (
                                                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
                                                    <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-2">
                                                        ❌ Critical information
                                                        missing (required to apply):
                                                    </p>
                                                    <ul className="text-sm text-red-600 dark:text-red-300 space-y-1">
                                                        {criticalMissing.map(
                                                            (
                                                                item: string,
                                                                index: number
                                                            ) => (
                                                                <li
                                                                    key={index}
                                                                    className="flex items-center gap-2"
                                                                >
                                                                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                                                                    {item}
                                                                </li>
                                                            )
                                                        )}
                                                    </ul>
                                                </div>
                                            )}
                                            {recommendedMissing.length > 0 && (
                                                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-md">
                                                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-2">
                                                        ⚠️ Recommended information
                                                        missing (improves your
                                                        chances):
                                                    </p>
                                                    <ul className="text-sm text-amber-600 dark:text-amber-300 space-y-1">
                                                        {recommendedMissing.map(
                                                            (
                                                                item: string,
                                                                index: number
                                                            ) => (
                                                                <li
                                                                    key={index}
                                                                    className="flex items-center gap-2"
                                                                >
                                                                    <span className="w-1 h-1 bg-amber-500 rounded-full"></span>
                                                                    {item}
                                                                </li>
                                                            )
                                                        )}
                                                    </ul>
                                                </div>
                                            )}
                                            {(criticalMissing.length > 0 ||
                                                recommendedMissing.length > 0) && (
                                                <Button
                                                    variant={
                                                        criticalMissing.length > 0
                                                            ? "default"
                                                            : "outline"
                                                    }
                                                    size="sm"
                                                    className="w-full"
                                                    onClick={() => {
                                                        onOpenChange(false);
                                                        router.push(
                                                            "/profile?update=true"
                                                        );
                                                    }}
                                                >
                                                    {criticalMissing.length > 0
                                                        ? "Complete Required Information"
                                                        : "Improve Your Profile"}
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Personal Information */}
                            <div className="space-y-3">
                                <h3 className="font-medium flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    Personal Information
                                </h3>
                                <div className="space-y-4 pl-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <span className="text-sm text-muted-foreground">
                                                Name
                                            </span>
                                            <p className="font-medium mt-1">
                                                {profile?.firstName &&
                                                profile?.lastName
                                                    ? `${profile.firstName} ${profile.lastName}`
                                                    : "Not provided"}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-muted-foreground">
                                                Email
                                            </span>
                                            <p className="font-medium mt-1">
                                                {profile?.email || "Not provided"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        {profile?.phone && (
                                            <div>
                                                <span className="text-sm text-muted-foreground">
                                                    Phone
                                                </span>
                                                <p className="font-medium mt-1">
                                                    {profile.phone}
                                                </p>
                                            </div>
                                        )}
                                        {profile?.location && (
                                            <div>
                                                <span className="text-sm text-muted-foreground">
                                                    Location
                                                </span>
                                                <p className="font-medium mt-1">
                                                    {profile.location}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <Separator className="my-4" />

                            {/* Professional Summary */}
                            {profile?.summary && (
                                <div className="space-y-3">
                                    <h3 className="font-medium">
                                        Professional Summary
                                    </h3>
                                    <div className="pl-6">
                                        <p className="text-sm leading-relaxed text-muted-foreground">
                                            {profile.summary}
                                        </p>
                                    </div>
                                    <Separator className="my-4" />
                                </div>
                            )}

                            {/* Skills */}
                            {profile?.skills && profile.skills.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="font-medium">Skills</h3>
                                    <div className="pl-6">
                                        <div className="flex flex-wrap gap-2">
                                            {profile.skills.map((skill, index) => (
                                                <Badge
                                                    key={index}
                                                    variant="secondary"
                                                    className="text-xs"
                                                >
                                                    {skill}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                    <Separator className="my-4" />
                                </div>
                            )}

                            {/* Resume Status */}
                            <div className="space-y-3">
                                <h3 className="font-medium flex items-center gap-2">
                                    📄 Resume
                                </h3>
                                <div className="pl-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {profile?.resumeUploaded ? (
                                                <CheckCircle className="w-5 h-5 text-green-500" />
                                            ) : (
                                                <AlertCircle className="w-5 h-5 text-amber-500" />
                                            )}
                                            <div>
                                                <span className="text-sm font-medium">
                                                    {profile?.resumeUploaded
                                                        ? "Resume uploaded and ready"
                                                        : "Resume required"}
                                                </span>
                                                {!profile?.resumeUploaded && (
                                                    <p className="text-xs text-muted-foreground">
                                                        Upload your resume to apply
                                                        for jobs
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        {!profile?.resumeUploaded && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    onOpenChange(false);
                                                    router.push(
                                                        "/profile?update=true"
                                                    );
                                                }}
                                            >
                                                Upload
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="instructions" className="space-y-4 mt-4">
                            <div className="space-y-3">
                                <h3 className="font-medium flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    Application Instructions
                                </h3>
                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">
                                        Add any specific instructions or notes for this application. This information will be used to customize your application.
                                    </p>
                                    <Textarea
                                        placeholder="Enter any specific instructions, requirements, or notes for this application..."
                                        value={instructions}
                                        onChange={(e) => setInstructions(e.target.value)}
                                        className="min-h-[120px] resize-none"
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        {/* Action Buttons */}
                        <div className="space-y-3 pt-4">
                            {criticalMissing.length > 0 && (
                                <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-md text-center">
                                    <p className="text-sm text-destructive font-medium mb-1">
                                        Cannot submit application
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Please complete the required information
                                        above
                                    </p>
                                </div>
                            )}
                            <div className="flex gap-3">
                                <Button
                                    onClick={handleApply}
                                    disabled={
                                        applying || criticalMissing.length > 0
                                    }
                                    className="flex-1"
                                >
                                    {applying ? (
                                        <>
                                            <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : criticalMissing.length > 0 ? (
                                        "Complete Profile First"
                                    ) : (
                                        "Submit Application"
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                    disabled={applying}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>

                        {applicationError && (
                            <div className="space-y-3">
                                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                                        <div className="space-y-2 flex-1">
                                            <h4 className="font-medium text-destructive">
                                                Application Failed
                                            </h4>
                                            <p className="text-sm text-destructive/80">
                                                {applicationError}
                                            </p>
                                            <div className="flex gap-2 pt-1">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    onClick={() => setApplicationError(null)}
                                                    className="h-8 text-xs"
                                                >
                                                    Dismiss
                                                </Button>
                                                {applicationError.includes("local automation server") && (
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        onClick={handleApply}
                                                        disabled={applying}
                                                        className="h-8 text-xs"
                                                    >
                                                        {applying ? "Retrying..." : "Retry"}
                                                    </Button>
                                                )}
                                                {(applicationError.includes("profile") || applicationError.includes("resume")) && (
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        onClick={() => {
                                                            onOpenChange(false);
                                                            router.push("/profile?update=true");
                                                        }}
                                                        className="h-8 text-xs"
                                                    >
                                                        Update Profile
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Tabs>
                )}
            </SheetContent>
        </Sheet>
    );
}
