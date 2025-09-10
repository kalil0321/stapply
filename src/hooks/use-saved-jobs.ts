import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface SaveJobData {
    jobId: string;
    notes?: string;
    status?: "interested" | "applied" | "interview" | "rejected" | "offer";
}

export function useSavedJobs() {
    const queryClient = useQueryClient();
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
            jobId,
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
        data: savedJobs,
        refetch: refetchSavedJobs,
        isFetching: fetchingSavedJobs,
    } = useQuery({
        queryKey: ["savedJobs"],
        queryFn: fetchSavedJobsQuery,
    });

    // Handle side effects when savedJobs data changes
    useEffect(() => {
        if (savedJobs) {
            const jobIds = new Set<string>(
                savedJobs?.map((saved: any) => saved.jobId as string) || []
            );
            setSavedJobIds(jobIds);
        }
    }, [savedJobs]);

    const addExternalJobsMutation = useMutation({
        mutationFn: async ({
            jobsData,
            mode,
        }: {
            jobsData: any;
            mode: string;
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
        async (jobsData: any, mode: "individual" | "bulk") => {
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
        fetchSavedJobs,
        addExternalJobs,
        isAddingExternal,
        savedJobIds,
    };
}
