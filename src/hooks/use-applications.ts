import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Application } from "@/lib/types";

interface CreateApplicationData {
    jobId: string;
}

export function useApplications() {
    const queryClient = useQueryClient();

    const fetchApplicationsQuery = async () => {
        const response = await fetch("/api/applications");
        if (!response.ok) {
            throw new Error("Failed to fetch applications");
        }

        const data = await response.json();
        return data.applications;
    };

    const {
        data: applications = [],
        isLoading,
        error,
        refetch: refetchApplications,
    } = useQuery({
        queryKey: ["applications"],
        queryFn: fetchApplicationsQuery,
    });

    const createApplicationMutation = useMutation({
        mutationFn: async ({ jobId }: CreateApplicationData) => {
            const response = await fetch("/api/applications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ jobId }),
            });

            if (!response.ok) {
                const error = await response.json();
                if (response.status === 409) {
                    toast.error("You have already applied to this job");
                } else {
                    throw new Error(
                        error.error || "Failed to create application"
                    );
                }
            }

            return response.json();
        },
        onSuccess: async () => {
            toast.success("Application submitted successfully!");
            await refetchApplications();
        },
        onError: (error) => {
            console.error("Error creating application:", error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to create application"
            );
        },
    });

    const createApplication = async (jobId: string) => {
        return createApplicationMutation.mutateAsync({ jobId });
    };

    const deleteApplicationMutation = useMutation({
        mutationFn: async (applicationId: string) => {
            const response = await fetch(`/api/applications/${applicationId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(
                    error.error || "Failed to delete application"
                );
            }

            return response.json();
        },
        onSuccess: async () => {
            toast.success("Application deleted successfully!");
            await refetchApplications();
        },
        onError: (error) => {
            console.error("Error deleting application:", error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to delete application"
            );
        },
    });

    const deleteApplication = async (applicationId: string) => {
        return deleteApplicationMutation.mutateAsync(applicationId);
    };

    // Helper function to get application stats
    const getApplicationStats = () => {
        const total = applications.length;
        const recent = applications.filter((app: any) => {
            const created = new Date(app.createdAt);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return created >= thirtyDaysAgo;
        }).length;

        return {
            total,
            recent,
        };
    };

    // Helper function to check if user has applied to a job
    const hasAppliedToJob = (jobId: string) => {
        return applications.some((app: any) => app.jobId === jobId);
    };

    return {
        applications,
        isLoading,
        error,
        createApplication,
        isCreating: createApplicationMutation.isPending,
        deleteApplication,
        isDeleting: deleteApplicationMutation.isPending,
        refetchApplications,
        getApplicationStats,
        hasAppliedToJob,
    };
}
