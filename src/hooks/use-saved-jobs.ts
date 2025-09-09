"use client";

import { useState, useEffect, useCallback } from "react";
import {
    SavedJob,
    getSavedJobs,
    saveJob,
    unsaveJob,
    isJobSaved,
    updateSavedJob,
    getSavedJobsByStatus,
    generateJobId,
} from "@/lib/saved-jobs";

export function useSavedJobs() {
    const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load saved jobs from localStorage
    const loadSavedJobs = useCallback(() => {
        const jobs = getSavedJobs();
        setSavedJobs(jobs);
        setIsLoading(false);
    }, []);

    // Save a job
    const handleSaveJob = useCallback((job: Omit<SavedJob, "id" | "savedAt" | "applicationStatus">) => {
        const success = saveJob(job);
        if (success) {
            loadSavedJobs();
        }
        return success;
    }, [loadSavedJobs]);

    // Unsave a job
    const handleUnsaveJob = useCallback((jobId: string) => {
        const success = unsaveJob(jobId);
        if (success) {
            loadSavedJobs();
        }
        return success;
    }, [loadSavedJobs]);

    // Check if a job is saved
    const checkIsJobSaved = useCallback((job: { title: string; company: string; link: string }) => {
        return isJobSaved(job);
    }, []);

    // Update a saved job
    const handleUpdateSavedJob = useCallback((jobId: string, updates: Partial<Pick<SavedJob, "applicationStatus" | "notes" | "appliedAt">>) => {
        const success = updateSavedJob(jobId, updates);
        if (success) {
            loadSavedJobs();
        }
        return success;
    }, [loadSavedJobs]);

    // Get jobs by status
    const getJobsByStatus = useCallback((status: SavedJob["applicationStatus"]) => {
        return getSavedJobsByStatus(status);
    }, []);

    // Get job ID for a given job
    const getJobId = useCallback((job: { title: string; company: string; link: string }) => {
        return generateJobId(job);
    }, []);

    useEffect(() => {
        loadSavedJobs();
    }, [loadSavedJobs]);

    return {
        savedJobs,
        isLoading,
        saveJob: handleSaveJob,
        unsaveJob: handleUnsaveJob,
        isJobSaved: checkIsJobSaved,
        updateSavedJob: handleUpdateSavedJob,
        getJobsByStatus,
        getJobId,
        refreshSavedJobs: loadSavedJobs,
    };
}

export function useSavedJobStatus(job: { title: string; company: string; link: string }) {
    const [isSaved, setIsSaved] = useState(false);
    const { isJobSaved, saveJob, unsaveJob, getJobId } = useSavedJobs();

    const jobId = getJobId(job);

    useEffect(() => {
        setIsSaved(isJobSaved(job));
    }, [isJobSaved, job]);

    const toggleSaved = useCallback(() => {
        if (isSaved) {
            const success = unsaveJob(jobId);
            if (success) {
                setIsSaved(false);
            }
            return success;
        } else {
            const success = saveJob(job);
            if (success) {
                setIsSaved(true);
            }
            return success;
        }
    }, [isSaved, job, jobId, saveJob, unsaveJob]);

    return {
        isSaved,
        toggleSaved,
        jobId,
    };
}
