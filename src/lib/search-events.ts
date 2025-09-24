import { EventEmitter } from "events";
import { db } from "@/db/drizzle";
import { jobs, searchResults, searches } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import type { SearchMetadata, SearchStatus } from "@/lib/types";

interface SearchJobPayload {
    id: string;
    searchId: string;
    jobId: string;
    similarityScore: string | null;
    relevanceScore: number | null;
    status: "pending" | "valid" | "invalid" | "partial";
    reason: string | null;
    source: string | null;
    createdAt: string;
    job: {
        id: string;
        link: string;
        title: string;
        location: string | null;
        company: string;
        description: string | null;
        employmentType: string | null;
        industry: string | null;
    };
}

export interface SearchStreamPayload {
    metadata: SearchMetadata | null;
    status: SearchStatus;
    valid: boolean;
    results: SearchJobPayload[];
    totalResults: number;
}

export interface SearchPayload {
    record: typeof searches.$inferSelect;
    response: SearchStreamPayload;
}

type SearchEmitterMap = Map<string, EventEmitter>;

const globalForSearchEvents = globalThis as unknown as {
    __searchEmitters?: SearchEmitterMap;
};

function getEmitterStore(): SearchEmitterMap {
    if (!globalForSearchEvents.__searchEmitters) {
        globalForSearchEvents.__searchEmitters = new Map();
    }
    return globalForSearchEvents.__searchEmitters;
}

export function getSearchEmitter(searchId: string) {
    const store = getEmitterStore();
    if (!store.has(searchId)) {
        const emitter = new EventEmitter();
        emitter.setMaxListeners(0);
        store.set(searchId, emitter);
    }

    return store.get(searchId)!;
}

export function releaseSearchEmitter(searchId: string) {
    const store = getEmitterStore();
    const emitter = store.get(searchId);
    if (emitter && emitter.listenerCount("update") === 0) {
        store.delete(searchId);
    }
}

export async function getSearchPayload(searchId: string): Promise<SearchPayload | null> {
    const [record] = await db
        .select()
        .from(searches)
        .where(eq(searches.id, searchId));

    if (!record) {
        return null;
    }

    const results = await db
        .select({
            id: searchResults.id,
            searchId: searchResults.searchId,
            jobId: searchResults.jobId,
            similarityScore: searchResults.similarityScore,
            relevanceScore: searchResults.relevanceScore,
            status: searchResults.status,
            reason: searchResults.reason,
            source: searchResults.source,
            createdAt: searchResults.createdAt,
            job: {
                id: jobs.id,
                link: jobs.link,
                title: jobs.title,
                location: jobs.location,
                company: jobs.company,
                description: jobs.description,
                employmentType: jobs.employmentType,
                industry: jobs.industry,
            },
        })
        .from(searchResults)
        .innerJoin(jobs, eq(searchResults.jobId, jobs.id))
        .where(eq(searchResults.searchId, searchId))
        .orderBy(asc(searchResults.createdAt));

    return {
        record,
        response: {
            metadata: record.metadata,
            status: record.status,
            valid: record.valid,
            results,
            totalResults: results.length,
        },
    };
}

export async function emitSearchUpdate(searchId: string) {
    const store = getEmitterStore();
    const emitter = store.get(searchId);
    if (!emitter || emitter.listenerCount("update") === 0) {
        return null;
    }

    const payload = await getSearchPayload(searchId);
    if (!payload) {
        return null;
    }

    emitter.emit("update", payload.response);
    return payload.response;
}
