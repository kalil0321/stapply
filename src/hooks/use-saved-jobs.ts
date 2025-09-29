import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import type { SavedJob, Job } from "@/lib/types";

interface SaveJobData {
    jobId: string;
    notes?: string;
    status?: "interested" | "applied" | "interview" | "rejected" | "offer";
}

interface ExternalJobData {
    title: string;
    company: string;
    location?: string;
    link?: string;
    description?: string;
    notes?: string;
    status?: string;
}

// API response type that includes the joined job data
interface SavedJobResponse {
    id: string;
    userId: string;
    jobId: string;
    notes: string | null;
    status: string | null;
    createdAt: string;
    updatedAt: string;
    job: {
        id: string;
        link: string;
        title: string;
        location: string | null;
        company: string;
        description: string | null;
        industry: string | null;
        employmentType: string | null;
        postedAt: string | null;
        createdAt: string | null;
    };
}

// Helper function to convert API response to the expected SavedJob format
const convertToSavedJob = (response: SavedJobResponse): SavedJob => {
    return {
        id: response.id,
        userId: response.userId,
        jobId: response.jobId,
        notes: response.notes || undefined,
        status: (response.status as "interested" | "applied" | "interview" | "rejected" | "offer") || "interested",
        createdAt: new Date(response.createdAt),
        updatedAt: new Date(response.updatedAt),
        job: {
            id: response.job.id,
            link: response.job.link,
            title: response.job.title,
            location: response.job.location || undefined,
            company: response.job.company,
            description: response.job.description || undefined,
            employment_type: response.job.employmentType || undefined,
            industry: response.job.industry || undefined,
            posted_at: response.job.postedAt ? new Date(response.job.postedAt) : undefined,
            created_at: response.job.createdAt ? new Date(response.job.createdAt) : undefined,
        },
    };
};

export function useSavedJobs() {
    const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState<Record<string, boolean>>({});
    const [isAddingExternal, setIsAddingExternal] = useState(false);

    const saveJobMutation = useMutation({
        mutationFn: async ({
            jobId,
            notes,
            status = "interested",
        }: SaveJobData) => {
            const response = await fetch("/api/saved-jobs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ jobId, notes, status }),
            });

            if (!response.ok) {
                const error = await response.json();
                if (response.status === 409) {
                    toast.error("Job is already saved");
                } else {
                    throw new Error(error.error || "Failed to save job");
                }
            }

            return response.ok;
        },
        onSuccess: async (_, variables) => {
            setSavedJobIds((prev) => new Set([...prev, variables.jobId]));
            toast.success("Job saved successfully!");
            await refetchSavedJobs();
        },
    });

    const saveJob = useCallback(
        async ({ jobId, notes, status = "interested" }: SaveJobData) => {
            setLoading((prev) => ({ ...prev, [jobId]: true }));
            try {
                const result = await saveJobMutation.mutateAsync({
                    jobId,
                    notes,
                    status,
                });
                return result;
            } catch (error) {
                console.error("Error saving job:", error);
                toast.error(
                    error instanceof Error
                        ? error.message
                        : "Failed to save job"
                );
                return false;
            } finally {
                setLoading((prev) => ({ ...prev, [jobId]: false }));
            }
        },
        [saveJobMutation]
    );

    const removeJobMutation = useMutation({
        mutationFn: async ({
            savedJobId,
        }: {
            savedJobId: string;
            jobId: string;
        }) => {
            const response = await fetch(`/api/saved-jobs/${savedJobId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to remove job");
            }

            return response.ok;
        },
        onSuccess: async (_, variables) => {
            setSavedJobIds((prev) => {
                const newSet = new Set(prev);
                newSet.delete(variables.jobId);
                return newSet;
            });
            toast.success("Job removed from saved");
            await refetchSavedJobs();
        },
    });

    const removeJob = useCallback(
        async (savedJobId: string, jobId: string) => {
            setLoading((prev) => ({ ...prev, [jobId]: true }));
            try {
                const result = await removeJobMutation.mutateAsync({
                    savedJobId,
                    jobId,
                });
                return result;
            } catch (error) {
                console.error("Error removing job:", error);
                toast.error(
                    error instanceof Error
                        ? error.message
                        : "Failed to remove job"
                );
                return false;
            } finally {
                setLoading((prev) => ({ ...prev, [jobId]: false }));
            }
        },
        [removeJobMutation]
    );

    const isJobSaved = useCallback(
        (jobId: string) => {
            return savedJobIds.has(jobId);
        },
        [savedJobIds]
    );

    const isLoading = useCallback(
        (jobId: string) => {
            return loading[jobId] || false;
        },
        [loading]
    );

    const fetchSavedJobsQuery = useCallback(async () => {
        const response = await fetch("/api/saved-jobs");
        if (!response.ok) {
            throw new Error("Failed to fetch saved jobs");
        }

        const data = await response.json();
        return data.savedJobs;
    }, []);

    const {
        data: savedJobsResponse = [],
        refetch: refetchSavedJobs,
        isFetching: fetchingSavedJobs,
        isLoading: isSavedJobsLoading,
    } = useQuery<SavedJobResponse[]>({
        queryKey: ["savedJobs"],
        queryFn: fetchSavedJobsQuery,
    });

    // Convert API response to expected SavedJob format
    const savedJobs: SavedJob[] = savedJobsResponse.map(convertToSavedJob);

    // Use ref to track previous job IDs and only update when they actually change
    const prevJobIdsRef = useRef<string>('');
    
    // Create a stable string representation of job IDs
    const currentJobIdsString = useMemo(() => {
        return savedJobsResponse
            .map((saved: SavedJobResponse) => saved.jobId)
            .sort()
            .join(',');
    }, [savedJobsResponse]);

    // Handle side effects when job IDs actually change
    useEffect(() => {
        if (prevJobIdsRef.current !== currentJobIdsString) {
            const jobIds = new Set<string>(
                currentJobIdsString ? currentJobIdsString.split(',') : []
            );
            setSavedJobIds(jobIds);
            prevJobIdsRef.current = currentJobIdsString;
        }
    }, [currentJobIdsString]);

    const addExternalJobsMutation = useMutation({
        mutationFn: async ({
            jobsData,
            mode,
        }: {
            jobsData: ExternalJobData | ExternalJobData[];
            mode: "individual" | "bulk";
        }) => {
            const response = await fetch("/api/saved-jobs/external", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...jobsData, mode }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to add external jobs");
            }

            return response.json();
        },
        onSuccess: async () => {
            await refetchSavedJobs();
        },
    });

    const addExternalJobs = useCallback(
        async (jobsData: ExternalJobData | ExternalJobData[], mode: "individual" | "bulk") => {
            setIsAddingExternal(true);
            try {
                const result = await addExternalJobsMutation.mutateAsync({
                    jobsData,
                    mode,
                });
                return result;
            } finally {
                setIsAddingExternal(false);
            }
        },
        [addExternalJobsMutation]
    );

    // Return fetchSavedJobs instead of refetchSavedJobs to match component expectation
    const fetchSavedJobs = useCallback(async () => {
        const result = await refetchSavedJobs();
        return result.data;
    }, [refetchSavedJobs]);

    return {
        saveJob,
        removeJob,
        isJobSaved,
        isLoading,
        savedJobs,
        isSavedJobsLoading,
        isFetchingSavedJobs: fetchingSavedJobs,
        fetchSavedJobs,
        refetchSavedJobs,
        addExternalJobs,
        isAddingExternal,
        savedJobIds,
    };
}
