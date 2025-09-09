"use client";

export interface SavedJob {
    id: string;
    title: string;
    company: string;
    location?: string;
    description?: string;
    link: string;
    postedAt?: string;
    source?: string;
    similarityScore?: number;
    relevanceScore?: number;
    appliedAt?: string;
    applicationStatus: "saved" | "applied" | "interview" | "rejected" | "accepted";
    notes?: string;
    savedAt: string;
}

const SAVED_JOBS_KEY = "bu-saved-jobs";

// Generate a unique ID for a job based on its content
export function generateJobId(job: { title: string; company: string; link: string }): string {
    const content = `${job.title}-${job.company}-${job.link}`;
    return btoa(content).replace(/[^a-zA-Z0-9]/g, "").substring(0, 16);
}

// Get all saved jobs from localStorage
export function getSavedJobs(): SavedJob[] {
    if (typeof window === "undefined") return [];
    
    try {
        const saved = localStorage.getItem(SAVED_JOBS_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (error) {
        console.error("Error loading saved jobs:", error);
        return [];
    }
}

// Save a job to localStorage
export function saveJob(job: Omit<SavedJob, "id" | "savedAt" | "applicationStatus">): boolean {
    if (typeof window === "undefined") return false;
    
    try {
        const savedJobs = getSavedJobs();
        const jobId = generateJobId(job);
        
        // Check if job is already saved
        if (savedJobs.some(savedJob => savedJob.id === jobId)) {
            return false; // Already saved
        }
        
        const newSavedJob: SavedJob = {
            ...job,
            id: jobId,
            savedAt: new Date().toISOString(),
            applicationStatus: "saved",
        };
        
        savedJobs.push(newSavedJob);
        localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify(savedJobs));
        return true;
    } catch (error) {
        console.error("Error saving job:", error);
        return false;
    }
}

// Remove a job from saved jobs
export function unsaveJob(jobId: string): boolean {
    if (typeof window === "undefined") return false;
    
    try {
        const savedJobs = getSavedJobs();
        const filteredJobs = savedJobs.filter(job => job.id !== jobId);
        
        if (filteredJobs.length === savedJobs.length) {
            return false; // Job not found
        }
        
        localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify(filteredJobs));
        return true;
    } catch (error) {
        console.error("Error removing saved job:", error);
        return false;
    }
}

// Check if a job is saved
export function isJobSaved(job: { title: string; company: string; link: string }): boolean {
    if (typeof window === "undefined") return false;
    
    const jobId = generateJobId(job);
    const savedJobs = getSavedJobs();
    return savedJobs.some(savedJob => savedJob.id === jobId);
}

// Update a saved job's application status or notes
export function updateSavedJob(jobId: string, updates: Partial<Pick<SavedJob, "applicationStatus" | "notes" | "appliedAt">>): boolean {
    if (typeof window === "undefined") return false;
    
    try {
        const savedJobs = getSavedJobs();
        const jobIndex = savedJobs.findIndex(job => job.id === jobId);
        
        if (jobIndex === -1) {
            return false; // Job not found
        }
        
        savedJobs[jobIndex] = { ...savedJobs[jobIndex], ...updates };
        localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify(savedJobs));
        return true;
    } catch (error) {
        console.error("Error updating saved job:", error);
        return false;
    }
}

// Get saved jobs by status
export function getSavedJobsByStatus(status: SavedJob["applicationStatus"]): SavedJob[] {
    return getSavedJobs().filter(job => job.applicationStatus === status);
}

// Get saved job by ID
export function getSavedJobById(jobId: string): SavedJob | null {
    const savedJobs = getSavedJobs();
    return savedJobs.find(job => job.id === jobId) || null;
}

// Clear all saved jobs (useful for development/testing)
export function clearAllSavedJobs(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(SAVED_JOBS_KEY);
}
