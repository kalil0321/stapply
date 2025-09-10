"use client";

import { Profile } from "@/components/profile";
import { ResumeStatus } from "@/components/profile/resume-status";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

async function fetchProfile() {
    const res = await fetch("/api/profile");
    if (!res.ok && res.status !== 404) {
        throw new Error("Failed to fetch profile");
    }
    if (res.status === 404) return null;
    const data = await res.json();
    return data.profile;
}

function ProfilePageSkeleton() {
    return (
        <div className="flex flex-col gap-8 p-6">
            {/* Header skeleton */}
            <div className="flex items-end justify-between border-b border-border pb-4">
                <div>
                    <Skeleton className="h-6 w-20" />
                </div>
                <Skeleton className="h-4 w-32" />
            </div>

            {/* Profile content skeleton - will be handled by ProfileDisplay */}
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-24" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="space-y-1">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    ))}
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-5 w-20" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ProfilePage() {
    const { data: profile, isLoading } = useQuery({
        queryKey: ["profile"],
        queryFn: fetchProfile,
    });

    if (isLoading) {
        return <ProfilePageSkeleton />;
    }

    return (
        <div className="flex flex-col gap-8 p-6">
            {/* Header */}
            <div className="flex items-end justify-between border-b border-border pb-4">
                <div>
                    <h1 className="text-xl font-medium">Profile</h1>
                </div>
            </div>

            <Profile />
        </div>
    );
}

function ProfileResumeStatus() {
    const { data: profile, isLoading } = useQuery({
        queryKey: ["profile"],
        queryFn: fetchProfile,
    });

    if (isLoading) {
        return <Skeleton className="h-4 w-32" />;
    }

    return (
        <ResumeStatus
            resumeUrl={profile?.resumeUrl}
            resumeUploaded={profile?.resumeUploaded}
        />
    );
}
