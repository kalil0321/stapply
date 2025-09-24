"use server";

import { Job, SearchPrivateMetadata } from "@/lib/types";
import { db } from "@/db/drizzle";
import { searchResults } from "@/db/schema";
import { validateJobBatch } from "@/app/actions/search/validation";
import { emitSearchUpdate } from "@/lib/search-events";

interface VectorJob {
    id: string;
    link: string;
    title: string;
    location: string;
    company: string;
    similarity_score: number;
}

interface JobWithScore extends Job {
    similarityScore?: number;
    source?: "sql" | "vector" | "both";
}

//TODO: maybe make it dynamic depending on user subscription? (not important)
const RESULTS_LIMIT = 20;

// TODO: add stream support
export async function combineResults(
    sqlResults: JobWithScore[] | any,
    vectorResults: VectorJob[],
    searchId: string,
    searchQuery: string,
    steps: SearchPrivateMetadata["steps"]
) {
    try {
        const startTime = Date.now();
        console.log(
            `Combining results: ${sqlResults.length} SQL + ${vectorResults.length} vector`
        );

        // Create maps for deduplication and scoring
        const jobMap = new Map<string, JobWithScore>();

        // Process SQL results (keyword-based search)
        sqlResults.forEach((job: JobWithScore, index: number) => {
            if (job.id) {
                jobMap.set(job.id, {
                    ...job,
                    source: "sql",
                });
            }
        });

        // Process vector results (semantic search)
        vectorResults.forEach((job: VectorJob, index: number) => {
            const existingJob = jobMap.get(job.id);
            if (existingJob) {
                existingJob.source = "both";
            } else if (job.id) {
                // Job only found in vector search
                jobMap.set(job.id, {
                    ...job,
                    similarityScore: job.similarity_score,
                    source: "vector",
                });
            }
        });

        const combinedJobs = Array.from(jobMap.values());

        console.log(`Combined to ${combinedJobs.length} unique jobs`);

        let numValidJobs = 0;
        let batchSize = 20;
        if (combinedJobs && combinedJobs.length > 0) {
            let i = 0;
            while (i < combinedJobs.length) {
                if (numValidJobs >= RESULTS_LIMIT) break;

                const batch = combinedJobs.slice(
                    i,
                    Math.min(i + batchSize, combinedJobs.length)
                );
                console.log("Processing batch", i, i + batch.length);
                for (const job of batch) {
                    await db.insert(searchResults).values({
                        searchId,
                        jobId: job.id,
                        similarityScore: (job.similarityScore || 0).toString(),
                        status: "pending",
                        reason: "",
                        source: job.source || "",
                    });
                }

                await emitSearchUpdate(searchId);

                try {
                    const { validJobs } = await validateJobBatch(
                        searchId,
                        searchQuery,
                        batch,
                        numValidJobs,
                        RESULTS_LIMIT,
                        steps
                    );
                    numValidJobs += validJobs;

                    await emitSearchUpdate(searchId);

                    // TODO: improve this formula later (don't focus on this)
                    i += batch.length;
                    batchSize = Math.min(RESULTS_LIMIT - numValidJobs, 20);
                } catch (error) {
                    console.error("Failed to validate jobs:", error);
                    await emitSearchUpdate(searchId);
                    break;
                }
            }
        }

        steps.push({
            name: "combine-results",
            duration: Date.now() - startTime,
        });

        return { status: 200 };
    } catch (error) {
        console.error("Error combining search results:", error);
        return {
            error: "Failed to combine search results",
            combinedJobs: [],
        };
    }
}
