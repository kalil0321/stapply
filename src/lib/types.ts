export interface SearchMetadata {
    query: {
        valid: boolean;
        enhanced: string | null;
        suggestion: string | null;
        reasoning: string | null;
    };
    filters: {
        name: string;
        value: string;
    }[];
    enrichments: {
        field: string;
        description: string;
    }[];
}

export interface SearchUsage {
    in: number;
    out: number;
    total: number;
    model: string;
    info: string;
}
export interface SearchStep {
    name: string;
    duration: number;
    usage: SearchUsage;
}

export type SearchPrivateMetadata = {
    steps: (SearchStep | { name: string; duration: number })[];
};

export type SearchStatus =
    | "in-progress"
    | "validating"
    | "query"
    | "data_validation"
    | "done";

export type LiveSearchStatus = 
    | "pending" 
    | "in_progress" 
    | "completed" 
    | "failed";

export interface SearchHistory {
    id: string;
    query: string;
    timestamp: number;
    metadata?: SearchMetadata;
    status?: SearchStatus | LiveSearchStatus;
    createdAt?: string;
    userId?: string;
    websetId?: string | null;
    valid?: boolean;
    type?: 'regular' | 'live';
    // Live search specific fields
    browserTaskId?: string;
    agentLogs?: string[];
    results?: any[];
    error?: string | null;
    updatedAt?: string;
    completedAt?: string | null;
}

export interface Job {
    id: string;
    link: string;
    title: string;
    location?: string;
    company: string;
    description?: string;
    employment_type?: string;
    industry?: string;
    posted_at?: Date;
    created_at?: Date;
}

export interface SearchResult {
    id: string;
    searchId: string;
    jobId: string;
    relevanceScore?: number;
    position: number;
    createdAt: Date;
    status: "valid" | "invalid" | "pending" | "partial";
    reason?: string;
    source?: "sql" | "vector" | "both" | "";
    job?: Job; // Optional populated job data
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