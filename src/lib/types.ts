export interface Job {
    id: string;
    link: string;
    title: string;
    location?: string;
    company: string;
    description?: string;
    employmentType?: string;
    industry?: string;
    salaryMin?: number | null;
    salaryMax?: number | null;
    salaryCurrency?: string;
    postedAt?: Date | string;
    createdAt?: Date | string;
    source?: string;
}

export interface SavedJob {
    id: string;
    userId: string;
    jobId: string;
    notes?: string;
    status: "interested" | "applied" | "interview" | "rejected" | "offer";
    createdAt: Date;
    updatedAt: Date;
    job?: Job; // Optional populated job data
}

export interface Application {
    id: string;
    userId: string;
    jobId: string;
    taskId: string;
    createdAt: Date;
    updatedAt: Date;
    job?: Job; // Optional populated job data
}