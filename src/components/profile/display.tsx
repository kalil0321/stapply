import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

interface ProfileData {
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    location?: string;
    nationality?: string;
    gender?: string;
    summary?: string;
    skills?: string[];
    experience?: any[];
    education?: any[];
    languages?: any[];
    resumeUrl?: string;
}

async function fetchProfile() {
    const res = await fetch("/api/profile");
    if (!res.ok) {
        throw new Error("Failed to fetch profile");
    }
    const data = await res.json();
    return data.profile as ProfileData;
}

function ProfileSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header skeleton */}
            <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-24" />
            </div>

            {/* Personal info grid skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-32" />
                </div>
                <div className="space-y-1">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-28" />
                </div>
                <div className="space-y-1">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-36" />
                </div>
                <div className="space-y-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                </div>
            </div>

            {/* Summary skeleton */}
            <div className="space-y-2">
                <Skeleton className="h-5 w-20" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-5/6" />
                </div>
            </div>

            {/* Skills skeleton */}
            <div className="space-y-2">
                <Skeleton className="h-5 w-16" />
                <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-18" />
                    <Skeleton className="h-6 w-22" />
                </div>
            </div>
        </div>
    );
}

export function ProfileDisplay() {
    const router = useRouter();
    const {
        data: profile,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ["profile"],
        queryFn: fetchProfile,
    });

    if (isLoading) {
        return <ProfileSkeleton />;
    }

    if (isError) {
        return (
            <div className="p-4 space-y-2">
                <p className="text-destructive">Unable to load profile.</p>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center p-6 space-y-4">
                {/*"bg-muted/40 rounded-lg border border-muted"*/}
                <div className="flex flex-col items-center space-y-2">
                    <svg
                        className="w-10 h-10 text-red-500 mb-1"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                    >
                        <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="2"
                            fill="none"
                        />
                        <path
                            d="M12 8v4m0 4h.01"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                    </svg>
                    <p className="text-base font-medium text-destructive">
                        No profile found
                    </p>
                    <p className="text-sm text-muted-foreground text-center max-w-xs">
                        We couldn't find your profile information.
                        <br />
                        Please create your profile to get started.
                    </p>
                </div>
                <button
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition text-sm font-medium shadow"
                    onClick={() => router.push("/profile?update=true")}
                >
                    <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                    >
                        <path
                            d="M12 4v16m8-8H4"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                    </svg>
                    Create Profile
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium">
                    {profile.firstName} {profile.lastName}
                </h2>
                <button
                    onClick={() => router.push("/profile?update=true")}
                    className="text-sm text-primary underline"
                >
                    Edit profile
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {profile.email && (
                    <div>
                        <span className="font-medium">Email: </span>
                        {profile.email}
                    </div>
                )}
                {profile.phone && (
                    <div>
                        <span className="font-medium">Phone: </span>
                        {profile.phone}
                    </div>
                )}
                {profile.location && (
                    <div>
                        <span className="font-medium">Location: </span>
                        {profile.location}
                    </div>
                )}
                {profile.nationality && (
                    <div>
                        <span className="font-medium">Nationality: </span>
                        {profile.nationality}
                    </div>
                )}
                {profile.gender && (
                    <div>
                        <span className="font-medium">Gender: </span>
                        {profile.gender}
                    </div>
                )}
            </div>

            {profile.summary && (
                <div>
                    <h3 className="font-medium mb-1">Summary</h3>
                    <p className="whitespace-pre-line text-sm">
                        {profile.summary}
                    </p>
                </div>
            )}

            {profile.skills && profile.skills.length > 0 && (
                <div>
                    <h3 className="font-medium mb-1">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                        {profile.skills.map((skill) => (
                            <span
                                key={skill}
                                className="px-2 py-1 text-xs bg-muted rounded"
                            >
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Additional sections like experience, education, languages can be added here */}
        </div>
    );
}
